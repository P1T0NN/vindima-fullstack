// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Internal — THE settlement seam (see `CheckoutPageSystemDesign.md` §6.2 + §7). The ONLY
 * place order side effects fire. Called by the manual admin flow or a payment webhook.
 *
 * **Idempotent:** an order already `paid` → no-op (webhook replay safe). A `cancelled` /
 * `refunded` order → throw (`ORDER_NOT_PENDING`): a settlement webhook for a dead order is
 * an incident to surface, not a silent success.
 *
 * On a fresh settlement, all in one transaction: status → `paid`, then (auth orders only)
 * grant the stamp, record the first purchase, apply any reward claim, and clear the server
 * cart. Every nested call is itself idempotent, so even a partial-failure replay converges.
 * The stamp subtotal is the POST-DISCOUNT, reward-line-excluded amount (`RewardSystem.md` §9).
 */
export const markOrderPaid = internalMutation({
	args: { orderId: v.id('orders'), paymentRef: v.optional(v.string()) },
	handler: async (ctx, args): Promise<null> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			throw new ConvexError({
				code: 'ORDER_NOT_FOUND',
				message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}

		if (order.status === 'paid') return null; // already settled — idempotent no-op
		if (order.status !== 'pending') {
			throw new ConvexError({
				code: 'ORDER_NOT_PENDING',
				message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' }
			} satisfies ConvexErrorPayload);
		}

		await ctx.db.patch(order._id, {
			status: 'paid',
			paymentRef: args.paymentRef ?? order.paymentRef
		});

		// Guest orders (userId null) earn no stamps, no welcome record, hold no claim.
		if (order.userId) {
			const userId = order.userId;

			// Stamp: post-discount subtotal, reward line already excluded from subtotalMinor.
			await ctx.runMutation(
				internal.tables.rewardLedger.mutations.grantStampForOrder.grantStampForOrder,
				{
					userId,
					orderId: order._id,
					subtotalMinorUnits: order.amounts.subtotalMinor - order.amounts.welcomeDiscountMinor
				}
			);

			// First-purchase record — ALWAYS, even discount 0, so a later config flip can't be gamed.
			await ctx.runMutation(
				internal.tables.firstPurchases.mutations.recordFirstPurchase.recordFirstPurchase,
				{
					userId,
					orderId: order._id,
					discountMinorUnits: order.amounts.welcomeDiscountMinor
				}
			);

			// Consume the reward claim, if one rode along. If it was cancelled concurrently,
			// honor the already-priced $0 line and settle anyway (spec §10 honest-debt rule).
			if (order.claimId) {
				try {
					await ctx.runMutation(
						internal.tables.rewardClaims.mutations.applyRewardClaim.applyRewardClaim,
						{ claimId: order.claimId, appliedTo: order._id }
					);
				} catch (err) {
					console.warn('[orders] applyRewardClaim failed on settle; settling anyway', {
						orderId: order._id,
						err
					});
				}
			}

			// Clear the server cart (idempotent; the success page also clears client-side).
			const cart = await ctx.db
				.query('carts')
				.withIndex('by_user', (q) => q.eq('userId', userId))
				.unique();
			if (cart && cart.lines.length > 0) {
				await ctx.db.patch(cart._id, { lines: [], updatedAt: Date.now() });
			}
		}

		return null;
	}
});
