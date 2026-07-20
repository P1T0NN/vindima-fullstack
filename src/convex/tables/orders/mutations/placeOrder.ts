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
import { getPaymentProvider } from '../providers/registry';

// SCHEMAS
import { placeOrderSchema } from '@/shared/features/orders/schemas/ordersSchemas';

// SCHEMA VALIDATORS
import { orderAmountsValidator } from '../validators/ordersValidators';
import { paymentInstructionValidator } from '../providers/types';
import { mutationResultWith } from '@/convex/helpers/mutationResult';

/**
 * Public — place an order (guest or authenticated). See `CheckoutPageSystemDesign.md` §6.1.
 *
 * The server is the price authority: it re-resolves and re-prices everything via `calculateOrderPrice`
 * (§5), ignoring any client-computed amounts. **Idempotent** on the client-generated
 * `attemptId` — a double-click, network retry, or back-button resubmit collapses to one order.
 *
 * Returns the shared `{ success, message, data? }` envelope. `data.payment` tells the client
 * what to do next (nothing for `manual`; a redirect URL for a hosted provider). Soft failures
 * (disabled, empty, unavailable lines) return `success: false` with a translatable key.
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

		// Idempotency: the same attempt always resolves to the same order.
		const existing = await ctx.db
			.query('orders')
			.withIndex('by_attempt', (q) => q.eq('attemptId', args.attemptId))
			.first();
		if (existing) {
			const payment = await getPaymentProvider().createPayment(existing);
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

		// Delivery kind must be enabled in config (a client can't order a disabled mode).
		if (args.delivery.kind === 'pickup' && !CHECKOUT_CONFIG.FULFILLMENT.PICKUP) {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_DELIVERY' } };
		}
		if (args.delivery.kind === 'delivery' && !CHECKOUT_CONFIG.FULFILLMENT.DELIVERY) {
			return { success: false, message: { key: 'CheckoutMessages.INVALID_DELIVERY' } };
		}

		// Clamp to the same limits the cart enforces, then let the server price it.
		const clampedLines = args.lines.slice(0, CART_CONFIG.MAX_LINES).map((l) => ({
			productRef: l.productRef,
			qty: Math.max(1, Math.min(CART_CONFIG.MAX_QTY_PER_LINE, Math.floor(l.qty)))
		}));

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
			note: args.note,
			claimId: priced.claimId
		});

		const number = `ORD-${orderId
			.replace(/[^A-Za-z0-9]/g, '')
			.slice(-6)
			.toUpperCase()}`;
		await ctx.db.patch(orderId, { number });

		const order = (await ctx.db.get(orderId))!;
		const payment = await getPaymentProvider().createPayment(order);

		// Manual orders have no online payment step. Optionally settle right away (mark paid → grant
		// stamp, record first purchase, apply claim) so rewards count now, rather than waiting for a
		// staff "confirm payment" action that doesn't exist yet. markOrderPaid is idempotent and a
		// no-op for guests. Skipped for `redirect` orders — those settle via the payment webhook.
		if (payment.kind === 'none' && CHECKOUT_CONFIG.SETTLE_ON_PLACE) {
			await ctx.runMutation(internal.tables.orders.mutations.markOrderPaid.markOrderPaid, {
				orderId
			});
		}

		return {
			success: true,
			message: { key: 'CheckoutMessages.ORDER_PLACED' },
			data: { orderId, number, amounts: priced.amounts, payment }
		};
	}
});
