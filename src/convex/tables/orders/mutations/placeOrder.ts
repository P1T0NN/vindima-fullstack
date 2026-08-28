// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';
import { mutation } from '@/convex/functions';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { CART_CONFIG } from '@/shared/features/cart/config.js';
import { CHECKOUT_CONFIG, FEATURES } from '@/shared/config.js';

// AUTH / RATE LIMIT
import { getAuthUserId } from '@/convex/betterAuth/helpers/getAuthUserId';

// HELPERS / PROVIDERS
import { calculateOrderPrice } from '../helpers/calculateOrderPrice';
import { buildOrderSearchText } from '../helpers/buildOrderSearchText';
import { isSameDraftInput } from '../helpers/isSameDraftInput';
import { getPaymentProvider } from '../providers/registry';
import { isPickupSlotBlocked } from '../../availability/helpers/isPickupSlotBlocked';

// SCHEMAS
import { placeOrderSchema } from '@/shared/features/orders/schemas/ordersSchemas';

// SCHEMA VALIDATORS
import { orderAmountsValidator } from '../validators/ordersValidators';
import { paymentInstructionValidator } from '../providers/types';
import { mutationResultWith } from '@/convex/validators/mutationResult';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/** Is this row still an in-progress checkout the same attempt may keep editing? */
function isLiveDraft(status: Doc<'orders'>['status']): boolean {
	return status === 'pending' || status === 'draft';
}

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
 * **An `online` order is not created here** — it is placed as a `draft`, so
 * nothing is emailed, listed, counted or searchable until Stripe confirms the payment.
 *
 * **Idempotency is now draft-shaped.** `attemptId` persists per browser, so while an order is
 * live (`pending` or `draft`) this mutation resolves to that SAME order every time:
 *   - identical request  → returned untouched (double-click / retry / resubmit), no writes;
 *   - changed request    → re-priced and patched IN PLACE, invalidating any Stripe session;
 *   - already settled    → returned as-is;
 *   - another user's     → `ATTEMPT_CONFLICT`, so a stale stored id can never touch it.
 * That is what guarantees one live draft per browser: no sibling pending orders to clean up,
 * and no superseded payment session left payable.
 *
 * Returns the shared `{ success, message, data? }` envelope. `data.payment` tells the client
 * what to do next: a pay-page redirect.
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
			return { success: false, message: 'El proceso de compra no está disponible por el momento.' };
		}

		// Authoritative run of the shared schema (contact/email/address shape). Semantic
		// checks (guest policy, empty order, delivery-mode enabled) follow with their own keys.
		const parsedInput = placeOrderSchema.safeParse(args);
		if (!parsedInput.success) {
			return { success: false, message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' };
		}

		const userId = await getAuthUserId(ctx);
		if (!userId && !CHECKOUT_CONFIG.ALLOW_GUEST_CHECKOUT) {
			return { success: false, message: 'Inicia sesión para realizar tu pedido.' };
		}
		if (args.lines.length === 0) {
			return { success: false, message: 'Tu carrito está vacío.' };
		}

		// Global rate limit — authed placement is bounded per user; guests have no per-user key
		// and are bounded by attemptId idempotency below + the pending-expiry cron (spec §6.1).
		// The draft this attempt resolves to, if any (one indexed point read).
		const existing = await ctx.db
			.query('orders')
			.withIndex('by_attempt', (q) => q.eq('attemptId', args.attemptId))
			.first();

		// A match that is no longer live (neither `pending` nor `draft`). The two cases are NOT
		// the same:
		//
		// `paid` — a genuine replay (stale form resubmitted after settling). Return it so the
		// shopper lands on their receipt; an online order's pay-page URL short-circuits there too
		// (`createCheckoutSession` §7.1.4).
		//
		// `cancelled` / `refunded` — DEAD. Returning one would report success and then send the
		// shopper to a pay page that can only reject it (`ORDER_NOT_PENDING`), and because the
		// attempt id is persistent that dead end would repeat on EVERY future checkout from this
		// browser until localStorage was cleared by hand. Reachable two ways: the customer cancels
		// their own order, or the pending-expiry cron cancels an abandoned one after the configured
		// expiry window. The attempt is spent — hand the client the same self-heal it already performs
		// for a draft
		// owned by someone else: forget the id, mint a new one, resubmit once.
		if (existing && !isLiveDraft(existing.status)) {
			if (existing.status !== 'paid') {
				return { success: false, message: 'Iniciamos un pedido nuevo. Inténtalo de nuevo.' };
			}

			const payment = await getPaymentProvider(existing.paymentMethod ?? 'online').createPayment(
				existing
			);
			return {
				success: true,
				message: 'Pedido realizado.',
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
			return { success: false, message: 'Iniciamos un pedido nuevo. Inténtalo de nuevo.' };
		}

		// Delivery kind must be enabled in config (a client can't order a disabled mode).
		if (args.delivery.kind === 'pickup' && !CHECKOUT_CONFIG.FULFILLMENT.PICKUP) {
			return { success: false, message: 'Esa opción de entrega no está disponible.' };
		}
		if (args.delivery.kind === 'delivery' && !CHECKOUT_CONFIG.FULFILLMENT.DELIVERY) {
			return { success: false, message: 'Esa opción de entrega no está disponible.' };
		}
		if (
			args.delivery.kind === 'pickup' &&
			(await isPickupSlotBlocked(ctx, args.delivery.pickupDate, args.delivery.pickupTime))
		) {
			return { success: false, message: 'Ese horario ya no está disponible. Elige otro.' };
		}

		// Chosen payment method must be enabled in config (a client can't pick a disabled card).
		if (!CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE) {
			return { success: false, message: 'Ese método de pago no está disponible.' };
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
				const payment = await getPaymentProvider(existing.paymentMethod ?? 'online').createPayment(
					existing
				);
				return {
					success: true,
					message: 'Pedido realizado.',
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
					message: 'Algunos artículos ya no están disponibles. Revisa tu pedido.',
					data: { unavailableRefs: priced.unavailableRefs }
				};
			}

			// Any live Stripe session now prices a superseded snapshot: drop it and expire it.
			// Bumping the attempt counter rotates the idempotency key so the next pay-page visit
			// mints a genuinely new session instead of replaying this one (§7.3.2/§7.3.3).
			const staleSessionRef = existing.paymentSessionRef;

			// Keep the unpaid draft out of admin search until payment settles.
			const status = 'draft' as const;

			await ctx.db.patch(existing._id, {
				userId: userId ?? existing.userId,
				email: args.contact.email,
				name: args.contact.name,
				phone: args.contact.phone,
				status,
				lines: priced.lines,
				amounts: priced.amounts,
				currency: priced.currency,
				delivery: args.delivery,
				paymentMethod: args.paymentMethod,
				note: args.note,
				claimId: priced.claimId,
				searchText:
					status === 'draft'
						? undefined
						: buildOrderSearchText({
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

			const updated = (await ctx.db.get(existing._id))!;

			const payment = await getPaymentProvider(args.paymentMethod).createPayment(updated);

			// Draft edits stay silent. The payment receipt is sent after Stripe settlement.
			return {
				success: true,
				message: 'Pedido realizado.',
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
				message: 'Algunos artículos ya no están disponibles. Revisa tu pedido.',
				data: { unavailableRefs: priced.unavailableRefs }
			};
		}

		const status = 'draft' as const;

		const orderId = await ctx.db.insert('orders', {
			userId: userId ?? null,
			email: args.contact.email,
			name: args.contact.name,
			phone: args.contact.phone,
			number: 'PENDING', // patched below once we have the id
			attemptId: args.attemptId,
			// Nothing has been charged, so this is not a real order until Stripe confirms payment.
			status,
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
			// Number only exists post-insert, so the search blob is written with it. A draft gets
			// none: writing the blob is what places a row in the admin `search_text` index, so
			// withholding it keeps unpaid online orders out of admin search by construction.
			// (The number itself IS assigned now, so it stays stable through payment and receipts.)
			...(status === 'draft'
				? {}
				: {
						searchText: buildOrderSearchText({
							number,
							name: args.contact.name,
							email: args.contact.email
						})
					})
		});

		const order = (await ctx.db.get(orderId))!;

		const payment = await getPaymentProvider(order.paymentMethod ?? 'online').createPayment(order);

		// Stripe creates the hosted payment session after this mutation; its webhook settles the
		// draft and sends the receipt.
		return {
			success: true,
			message: 'Pedido realizado.',
			data: { orderId, number, amounts: priced.amounts, payment }
		};
	}
});
