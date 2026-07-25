// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { CART_CONFIG, CHECKOUT_CONFIG, FEATURES } from '@/shared/config.js';

// AUTH / RATE LIMIT
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { convexRateLimiter } from '@/convex/convexRateLimiter';

// HELPERS / PROVIDERS
import { calculateOrderPrice } from '../helpers/calculateOrderPrice';
import { buildOrderSearchText } from '../helpers/buildOrderSearchText';
import { orderCountAggregate } from '../helpers/orderCountAggregate';
import { isSameDraftInput } from '../helpers/isSameDraftInput';
import { getPaymentProvider } from '../providers/registry';

// SCHEMAS
import { placeOrderSchema } from '@/shared/features/orders/schemas/ordersSchemas';

// SCHEMA VALIDATORS
import { orderAmountsValidator } from '../validators/ordersValidators';
import { paymentInstructionValidator } from '../providers/types';
import { mutationResultWith } from '@/convex/helpers/mutationResult';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Does the draft still hold exactly the reward claim the caller has active right now?
 *
 * The one piece of state that can change an order's lines WITHOUT the request changing (the
 * shopper claimed or cancelled a free item in another tab). Checking it keeps the "pure retry"
 * fast path from ever returning a draft that disagrees with the summary on screen — one
 * indexed read, and on a genuine double-click it always matches, so no writes happen.
 */
async function holdsCurrentClaim(
	ctx: MutationCtx,
	order: Doc<'orders'>,
	userId: string | null
): Promise<boolean> {
	if (!userId || !FEATURES.REWARDS) return order.claimId === undefined;
	const active = await ctx.db
		.query('rewardClaims')
		.withIndex('by_user_status', (q) => q.eq('userId', userId).eq('status', 'active'))
		.first();
	return (active?._id ?? undefined) === order.claimId;
}

/**
 * Public — place an order (guest or authenticated). See `CheckoutPageSystemDesign.md` §6.1 and
 * its amendment, `StripeSystemDesign.md` §5.3 (**draft-until-paid**).
 *
 * The server is the price authority: it re-resolves and re-prices everything via
 * `calculateOrderPrice` (checkout spec §5), ignoring any client-computed amounts.
 *
 * **Idempotency is now draft-shaped.** `attemptId` persists per browser, so while an order is
 * `pending` this mutation resolves to that SAME order every time:
 *   - identical request  → returned untouched (double-click / retry / resubmit), no writes;
 *   - changed request    → re-priced and patched IN PLACE, invalidating any Stripe session;
 *   - already settled    → returned as-is;
 *   - another user's     → `ATTEMPT_CONFLICT`, so a stale stored id can never touch it.
 * That is what guarantees one live draft per browser: no sibling pending orders to clean up,
 * and no superseded payment session left payable.
 *
 * Returns the shared `{ success, message, data? }` envelope. `data.payment` tells the client
 * what to do next (nothing for cash; a pay-page redirect for online).
 */
export const placeOrder = mutation({
	// Wire shape + input rules come from the SHARED `placeOrderSchema` — the checkout form's
	// flat model validates the same rules pre-submit before `transformArgs` nests it.
	args: zodToConvexFields(placeOrderSchema.shape),
	returns: mutationResultWith(
		v.object({
			orderId: v.optional(v.id('orders')),
			number: v.optional(v.string()),
			amounts: v.optional(orderAmountsValidator),
			payment: v.optional(paymentInstructionValidator),
			unavailableRefs: v.optional(v.array(v.string()))
		})
	),
	handler: async (ctx, args) => {
		if (!FEATURES.CHECKOUT) {
			return { success: false, message: { key: 'CheckoutMessages.CHECKOUT_DISABLED' } };
		}

		// Authoritative run of the shared schema (contact/email/address shape). Semantic
		// checks (guest policy, empty order, delivery-mode enabled) follow with their own keys.
		const parsedInput = placeOrderSchema.safeParse(args);
		if (!parsedInput.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}

		const userId = await getAuthUserId(ctx);
		if (!userId && !CHECKOUT_CONFIG.ALLOW_GUEST_CHECKOUT) {
			return { success: false, message: { key: 'CheckoutMessages.AUTH_REQUIRED' } };
		}
		if (args.lines.length === 0) {
			return { success: false, message: { key: 'CheckoutMessages.EMPTY_ORDER' } };
		}

		// Rate-limit authed placement per user. Guests have no per-user key; their placement is
		// bounded by attemptId idempotency below + the pending-expiry cron (spec §6.1).
		if (userId) {
			await convexRateLimiter.limit(ctx, 'placeOrder', { key: userId, throws: true });
		}

		// The draft this attempt resolves to, if any (one indexed point read).
		const existing = await ctx.db
			.query('orders')
			.withIndex('by_attempt', (q) => q.eq('attemptId', args.attemptId))
			.first();

		// A match that is no longer pending. The two cases are NOT the same:
		//
		// `paid` — a genuine replay (stale form resubmitted after settling). Return it so the
		// shopper lands on their receipt; an online order's pay-page URL short-circuits there too
		// (`createCheckoutSession` §7.1.4).
		//
		// `cancelled` / `refunded` — DEAD. Returning one would report success and then send the
		// shopper to a pay page that can only reject it (`ORDER_NOT_PENDING`), and because the
		// attempt id is persistent that dead end would repeat on EVERY future checkout from this
		// browser until localStorage was cleared by hand. Reachable two ways: the customer cancels
		// their own order, or the pending-expiry cron cancels an abandoned one 48h later. So the
		// attempt is spent — hand the client the same self-heal it already performs for a draft
		// owned by someone else: forget the id, mint a new one, resubmit once.
		if (existing && existing.status !== 'pending') {
			if (existing.status !== 'paid') {
				return { success: false, message: { key: 'CheckoutMessages.ATTEMPT_CONFLICT' } };
			}

			const payment = await getPaymentProvider(existing.paymentMethod ?? 'cash').createPayment(
				existing
			);
			return {
				success: true,
				message: { key: 'CheckoutMessages.ORDER_PLACED' },
				data: {
					orderId: existing._id,
					number: existing.number,
					amounts: existing.amounts,
					payment
				}
			};
		}

		// A draft owned by somebody else — a stale stored `attemptId` on a shared computer, or a
		// signed-out draft being reused. Never read or mutate it; the client silently regenerates
		// its id and resubmits once (§5.3.4).
		if (existing && existing.userId !== null && existing.userId !== userId) {
			return { success: false, message: { key: 'CheckoutMessages.ATTEMPT_CONFLICT' } };
		}

		// Delivery kind must be enabled in config (a client can't order a disabled mode).
		if (args.delivery.kind === 'pickup' && !CHECKOUT_CONFIG.FULFILLMENT.PICKUP) {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_DELIVERY' } };
		}
		if (args.delivery.kind === 'delivery' && !CHECKOUT_CONFIG.FULFILLMENT.DELIVERY) {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_DELIVERY' } };
		}

		// Chosen payment method must be enabled in config (a client can't pick a disabled card).
		const methodEnabled =
			(args.paymentMethod === 'cash' && CHECKOUT_CONFIG.PAYMENT_METHODS.CASH) ||
			(args.paymentMethod === 'online' && CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE);
		if (!methodEnabled) {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_PAYMENT_METHOD' } };
		}

		// Clamp to the same limits the cart enforces, then let the server price it.
		const clampedLines = args.lines.slice(0, CART_CONFIG.MAX_LINES).map((l) => ({
			productRef: l.productRef,
			qty: Math.max(1, Math.min(CART_CONFIG.MAX_QTY_PER_LINE, Math.floor(l.qty)))
		}));

		// ── Existing pending draft ────────────────────────────────────────────────────────────
		if (existing) {
			// A guest draft whose shopper has since signed in is ADOPTED rather than abandoned:
			// re-pricing under their identity picks up their claim and welcome discount, and the
			// order lands in their history instead of expiring as an orphan.
			const adopting = existing.userId === null && userId !== null;

			if (
				!adopting &&
				isSameDraftInput(existing, args, clampedLines) &&
				(await holdsCurrentClaim(ctx, existing, userId))
			) {
				// Pure retry — zero writes, live payment session preserved (§5.3.5).
				const payment = await getPaymentProvider(existing.paymentMethod ?? 'cash').createPayment(
					existing
				);
				return {
					success: true,
					message: { key: 'CheckoutMessages.ORDER_PLACED' },
					data: {
						orderId: existing._id,
						number: existing.number,
						amounts: existing.amounts,
						payment
					}
				};
			}

			// Something changed → re-price and update the SAME order (§5.3.6).
			const priced = await calculateOrderPrice(ctx, {
				userId,
				lines: clampedLines,
				deliveryKind: args.delivery.kind
			});
			if (!priced.ok) {
				return {
					success: false,
					message: { key: 'CheckoutMessages.UNAVAILABLE_LINES' },
					data: { unavailableRefs: priced.unavailableRefs }
				};
			}

			// Any live Stripe session now prices a superseded snapshot: drop it and expire it.
			// Bumping the attempt counter rotates the idempotency key so the next pay-page visit
			// mints a genuinely new session instead of replaying this one (§7.3.2/§7.3.3).
			const staleSessionRef = existing.paymentSessionRef;

			await ctx.db.patch(existing._id, {
				userId: userId ?? existing.userId,
				email: args.contact.email,
				name: args.contact.name,
				phone: args.contact.phone,
				lines: priced.lines,
				amounts: priced.amounts,
				currency: priced.currency,
				delivery: args.delivery,
				paymentMethod: args.paymentMethod,
				note: args.note,
				claimId: priced.claimId,
				searchText: buildOrderSearchText({
					number: existing.number,
					name: args.contact.name,
					email: args.contact.email
				}),
				...(staleSessionRef
					? {
							paymentSessionRef: undefined,
							paymentSessionAttempt: (existing.paymentSessionAttempt ?? 0) + 1
						}
					: {})
			});

			// Commit-gated, so a rolled-back edit expires nothing. The sub-second gap before it
			// lands is covered by the webhook's session-match check (§8.2.4b).
			if (staleSessionRef) {
				void ctx.scheduler.runAfter(
					0,
					internal.stripe.actions.expireStripeSession.expireStripeSession,
					{ sessionRef: staleSessionRef }
				);
			}

			// The order stays `pending`, so its work-queue bucket is unchanged — no aggregate
			// write needed here (only status/fulfillment transitions move buckets).

			const updated = (await ctx.db.get(existing._id))!;
			const payment = await getPaymentProvider(args.paymentMethod).createPayment(updated);

			// Same settle-on-place rule as a fresh cash order (idempotent; no-op if already paid).
			if (payment.kind === 'none' && CHECKOUT_CONFIG.SETTLE_ON_PLACE) {
				await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
					orderId: existing._id
				});
			}

			// No second O1 email on an update — the one already sent points at the pay page, which
			// always reflects the current draft (§5.3.7).

			return {
				success: true,
				message: { key: 'CheckoutMessages.ORDER_PLACED' },
				data: {
					orderId: existing._id,
					number: existing.number,
					amounts: priced.amounts,
					payment
				}
			};
		}

		// ── Fresh order ───────────────────────────────────────────────────────────────────────
		const priced = await calculateOrderPrice(ctx, {
			userId,
			lines: clampedLines,
			deliveryKind: args.delivery.kind
		});
		if (!priced.ok) {
			return {
				success: false,
				message: { key: 'CheckoutMessages.UNAVAILABLE_LINES' },
				data: { unavailableRefs: priced.unavailableRefs }
			};
		}

		const orderId = await ctx.db.insert('orders', {
			userId: userId ?? null,
			email: args.contact.email,
			name: args.contact.name,
			phone: args.contact.phone,
			number: 'PENDING', // patched below once we have the id
			attemptId: args.attemptId,
			status: 'pending',
			fulfillment: null,
			lines: priced.lines,
			amounts: priced.amounts,
			currency: priced.currency,
			delivery: args.delivery,
			paymentMethod: args.paymentMethod,
			note: args.note,
			claimId: priced.claimId
		});

		const number = `ORD-${orderId
			.replace(/[^A-Za-z0-9]/g, '')
			.slice(-6)
			.toUpperCase()}`;
		await ctx.db.patch(orderId, {
			number,
			// Number only exists post-insert, so the search blob is written with it.
			searchText: buildOrderSearchText({
				number,
				name: args.contact.name,
				email: args.contact.email
			})
		});

		const order = (await ctx.db.get(orderId))!;
		// Work-queue counter: a fresh order enters the 'pending' bucket.
		await orderCountAggregate.insert(ctx, order);

		const payment = await getPaymentProvider(order.paymentMethod ?? 'cash').createPayment(order);

		// Manual orders have no online payment step. Optionally settle right away (mark paid → grant
		// stamp, record first purchase, apply claim) so rewards count now, rather than waiting for a
		// staff "confirm payment" action. markOrderPaid is idempotent and a no-op for guests.
		// Skipped for `redirect` orders — those settle via the Stripe webhook.
		if (payment.kind === 'none' && CHECKOUT_CONFIG.SETTLE_ON_PLACE) {
			await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
				orderId
			});
		}

		// O1 "order received" — ONLY when the order is still pending (the collapse rule,
		// `EmailSystemDesign.md` §4.2). A settle-on-place order is already paid → O2 covers it,
		// so we send nothing here and avoid two emails for one click.
		const settled = await ctx.db.get(orderId);
		if (settled?.status === 'pending') {
			void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
				kind: 'orderReceived',
				orderId,
				paymentUrl: payment.kind === 'redirect' ? payment.url : undefined
			});
		}

		return {
			success: true,
			message: { key: 'CheckoutMessages.ORDER_PLACED' },
			data: { orderId, number, amounts: priced.amounts, payment }
		};
	}
});
