'use node';

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { action } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { CHECKOUT_CONFIG, STRIPE_CONFIG } from '@/shared/config.js';

// AUTH / RATE LIMIT
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';
import { convexRateLimiter } from '@/convex/convexRateLimiter';

// STRIPE (all SDK access goes through these helpers — see convex/stripe/stripeClient.ts)
import { retrieveCheckoutSession } from '@/convex/stripe/helpers/retrieveCheckoutSession';
import { createCheckoutSession as createStripeSession } from '@/convex/stripe/helpers/createCheckoutSession';
import { expireCheckoutSession } from '@/convex/stripe/helpers/expireCheckoutSession';
import { createOneTimeCoupon } from '@/convex/stripe/helpers/createOneTimeCoupon';

// PURE
import { stripeSessionExpiresAt } from '@/shared/features/stripe/utils/stripeSessionExpiresAt';

// HELPERS
import { successPageUrl, checkoutPageUrl } from '../helpers/orderUrls';

// VALIDATORS
import { mutationResultWith } from '@/convex/helpers/mutationResult';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { ConvexErrorPayload, ConvexMutationResult } from '@/convex/types/convexTypes';
import type { StripeCheckoutDiscount } from '@/shared/features/stripe/types/stripeTypes';

/** Annotated explicitly: this action calls other functions through `internal`, and without a
 *  declared return type TypeScript can't break the resulting inference cycle. */
type CheckoutSessionResult = ConvexMutationResult<{ url?: string }>;

/** What the session we are about to build must charge, recomputed from the order's own lines. */
function expectedSessionTotal(order: Doc<'orders'>): number {
	const lineTotal = order.lines.reduce((sum, line) => sum + line.unitPriceMinor * line.qty, 0);
	return lineTotal - order.amounts.welcomeDiscountMinor + order.amounts.shippingMinor;
}

function amountMismatch(orderId: string, expected: number, actual: number): ConvexError<never> {
	console.error('[orders] stripe session amount mismatch — refusing to hand out a payment URL', {
		orderId,
		expected,
		actual
	});
	return new ConvexError({
		code: 'PAYMENT_AMOUNT_MISMATCH',
		message: { key: 'CheckoutMessages.PAYMENT_AMOUNT_MISMATCH' }
	} satisfies ConvexErrorPayload) as ConvexError<never>;
}

/**
 * Public action — mint (or reuse) the Stripe Checkout Session for an `online` order and return
 * the URL the browser should follow. THE only function that creates a charge
 * (`StripeSystemDesign.md` §7). Called by `/checkout/pay`, which is reached from the placement
 * redirect, the O1 email CTA, and any payment resume.
 *
 * Invariant it upholds: **at most one open session per order, always priced from the order's
 * current snapshot.** Reuse keeps refreshes and double-clicks on one session; the idempotency
 * key (rotated only when a session is invalidated) collapses concurrent creates to one session
 * at Stripe's end; every draft edit clears the ref before this can hand it out again.
 *
 * An action is a public endpoint, so the order is access-checked exactly like `fetchOrder`
 * (owner, or guest presenting the matching email) and a miss returns ORDER_NOT_FOUND rather
 * than leaking existence.
 */
export const createCheckoutSession = action({
	args: { orderId: v.id('orders'), email: v.optional(v.string()) },
	returns: mutationResultWith(v.object({ url: v.optional(v.string()) })),
	handler: async (ctx, args): Promise<CheckoutSessionResult> => {
		const order: Doc<'orders'> | null = await ctx.runQuery(
			internal.tables.orders.helpers.getOrderForPayment.getOrderForPayment,
			{ orderId: args.orderId }
		);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}

		// Access = the fetchOrder rule (checkout spec §6.1). Hostile input by default.
		if (order.userId) {
			const userId = await getAuthUserId(ctx);
			if (userId !== order.userId) {
				return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
			}
		} else if (!args.email || args.email.trim().toLowerCase() !== order.email.toLowerCase()) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}

		// A cash order has no pay page.
		if ((order.paymentMethod ?? 'cash') !== 'online') {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_PAYMENT_METHOD' } };
		}

		// Already settled: a stale email CTA lands on the receipt, not an error.
		if (order.status === 'paid') {
			return {
				success: true,
				message: { key: 'CheckoutMessages.ORDER_PLACED' },
				data: { url: successPageUrl(order) }
			};
		}
		if (order.status !== 'pending') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' } };
		}

		// This endpoint creates objects on an external API — keyed by order so one order can't be
		// used as a free Stripe-API lever.
		await convexRateLimiter.limit(ctx, 'createCheckoutSession', {
			key: order._id,
			throws: true
		});

		// A fully-free order (claimed reward + pickup) has nothing to collect, and Stripe cannot
		// create a zero-amount session — settle it directly (§7.1.5).
		if (order.amounts.totalMinor === 0) {
			await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
				orderId: order._id
			});
			return {
				success: true,
				message: { key: 'CheckoutMessages.ORDER_PLACED' },
				data: { url: successPageUrl(order) }
			};
		}

		// The order's own numbers must already agree before we involve Stripe at all.
		const expectedTotal = expectedSessionTotal(order);
		if (expectedTotal !== order.amounts.totalMinor) {
			throw amountMismatch(order._id, order.amounts.totalMinor, expectedTotal);
		}

		const currency = order.currency.toLowerCase();

		try {
			// 1 ── Reuse whatever is already attached (§7.3.1).
			let attempt = order.paymentSessionAttempt ?? 0;
			if (order.paymentSessionRef) {
				const open = await retrieveCheckoutSession(order.paymentSessionRef);
				if (open?.status === 'open' && open.url) {
					return {
						success: true,
						message: { key: 'CheckoutMessages.ORDER_PLACED' },
						data: { url: open.url }
					};
				}
				if (open?.status === 'complete') {
					// Paid; the webhook is in flight. The success page shows "confirming…".
					return {
						success: true,
						message: { key: 'CheckoutMessages.ORDER_PLACED' },
						data: { url: successPageUrl(order) }
					};
				}
				// Expired or unretrievable → detach + rotate the key, race-safely.
				attempt = await ctx.runMutation(
					internal.tables.orders.mutations.setPaymentSession.invalidatePaymentSession,
					{ orderId: order._id, expectedRef: order.paymentSessionRef }
				);
			}

			// 2 ── The order must have enough life left to be payable (§7.3.4).
			const expiresAt = stripeSessionExpiresAt({
				orderCreatedAt: order._creationTime,
				pendingExpiryHours: CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS,
				now: Date.now()
			});
			if (expiresAt === null) {
				return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' } };
			}

			// 3 ── The welcome discount travels as an ad-hoc, single-use coupon created on THIS
			// account, right now (§2).
			const welcome = order.amounts.welcomeDiscountMinor;
			let discounts: StripeCheckoutDiscount[] | undefined;
			if (welcome > 0) {
				const couponId = await createOneTimeCoupon(
					{ amountOff: welcome, currency, name: STRIPE_CONFIG.LABELS.WELCOME_DISCOUNT },
					`coupon:${order._id}:${attempt}`
				);
				discounts = [{ coupon: couponId }];
			}

			// 4 ── Create. Everything inline; no account-scoped object is referenced, and
			// `payment_method_types` is omitted so each store's dashboard decides which methods
			// (card, wallets, OXXO, SEPA…) appear — code never changes per store (§2).
			const session = await createStripeSession(
				{
					mode: 'payment',
					client_reference_id: order._id,
					metadata: { orderId: order._id, orderNumber: order.number },
					customer_email: order.email,
					// Pinned per `STRIPE_CONFIG.ACCOUNT_BEHAVIOR` (both off by default) so the same
					// code charges the same number on ANY Stripe account, rather than inheriting
					// each dashboard's Adaptive Pricing / Stripe Tax settings (§2). Both are
					// coupled to the amount assertion below — see the config block before flipping.
					adaptive_pricing: { enabled: STRIPE_CONFIG.ACCOUNT_BEHAVIOR.ADAPTIVE_PRICING },
					automatic_tax: { enabled: STRIPE_CONFIG.ACCOUNT_BEHAVIOR.AUTOMATIC_TAX },
					line_items: order.lines.map((line) => ({
						quantity: line.qty,
						price_data: {
							currency,
							unit_amount: line.unitPriceMinor, // the reward line rides along at 0
							product_data: { name: line.name } // the frozen snapshot name
						}
					})),
					discounts,
					// Shipping as Stripe's own line so the hosted page itemises it honestly;
					// 0 (pickup / free-above) renders as free rather than hiding the row.
					shipping_options: [
						{
							shipping_rate_data: {
								type: 'fixed_amount',
								display_name:
									order.delivery.kind === 'pickup'
										? STRIPE_CONFIG.LABELS.PICKUP
										: STRIPE_CONFIG.LABELS.SHIPPING,
								fixed_amount: { amount: order.amounts.shippingMinor, currency }
							}
						}
					],
					payment_intent_data: { description: order.number },
					success_url: successPageUrl(order),
					cancel_url: checkoutPageUrl(),
					expires_at: expiresAt
				},
				// Rotates ONLY when a session was invalidated, so concurrent creates share a key
				// (→ one session) while a post-edit create gets a fresh one (§7.3.2).
				`sess:${order._id}:${attempt}`
			);

			// 5 ── Last line before money: what Stripe will actually charge must equal the order.
			if (session.amount_total !== order.amounts.totalMinor) {
				const error = amountMismatch(
					order._id,
					order.amounts.totalMinor,
					session.amount_total ?? -1
				);
				// Never leave a wrongly-priced session payable.
				await expireCheckoutSession(session.id).catch(() => undefined);
				throw error;
			}
			if (!session.url) {
				console.error('[orders] stripe session has no url', { orderId: order._id });
				return { success: false, message: { key: 'CheckoutMessages.PAYMENT_SESSION_FAILED' } };
			}

			await ctx.runMutation(internal.tables.orders.mutations.setPaymentSession.setPaymentSession, {
				orderId: order._id,
				sessionRef: session.id
			});

			return {
				success: true,
				message: { key: 'CheckoutMessages.ORDER_PLACED' },
				data: { url: session.url }
			};
		} catch (err) {
			// Our own typed refusals (amount mismatch) must stay loud.
			if (err instanceof ConvexError) throw err;
			// Everything else — Stripe down, amount under the currency minimum, bad config — is a
			// soft failure: the order stays `pending` and the pay page offers a retry (§13).
			console.error('[orders] stripe checkout session failed', { orderId: order._id, err });
			return { success: false, message: { key: 'CheckoutMessages.PAYMENT_SESSION_FAILED' } };
		}
	}
});
