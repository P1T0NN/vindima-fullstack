// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/functions';
import { internal } from '@/convex/_generated/api';

// ANALYTICS
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';

// TYPES
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * Internal (admin path) — refund a paid order. `paid → refunded`, then reverse the order's
 * stamp (`RewardSystem.md` §6) and release any reward claim the order consumed
 * (`applied → active`, so the customer keeps their free item and can pick again — DECISION
 * 2026-07-20, overriding spec §9's no-clawback stance: the money came back, so the reward
 * does too). Deliberately does NOT restore the welcome-offer row (`RewardSystem.md` §15.7 —
 * prevents buy-refund-rebuy cycling). Throws if the order isn't currently `paid`.
 */
export const markOrderRefunded = internalMutation({
	args: { orderId: v.id('orders') },
	handler: async (ctx, args): Promise<null> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			throw new ConvexError({
				code: 'ORDER_NOT_FOUND',
				message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}
		if (order.status !== 'paid') {
			throw new ConvexError({
				code: 'ORDER_NOT_PAID',
				message: { key: 'CheckoutMessages.ORDER_NOT_PENDING' }
			} satisfies ConvexErrorPayload);
		}

		// Work-queue counter follows automatically (open → closed) — see `convex/counters.ts`.
		await ctx.db.patch(order._id, { status: 'refunded', refundedAt: Date.now() });

		// Analytics — the money-path event; `dedupeKey` makes replays a no-op. Never blocks
		// the refund.
		try {
			await analytics.track(ctx, ANALYTICS_EVENT.ORDER_REFUNDED, {
				subjectRef: order.userId ?? undefined,
				props: { amountMinor: order.amounts.totalMinor, currency: order.currency },
				dedupeKey: `order-refunded:${order._id}`
			});
		} catch (err) {
			console.warn('[orders] analytics track failed on refund; refunding anyway', {
				orderId: order._id,
				err
			});
		}

		if (order.userId) {
			await ctx.runMutation(
				internal.tables.rewardLedger.mutations.revokeStampForOrder.revokeStampForOrder,
				{ orderId: order._id }
			);
		}
		if (order.claimId) {
			await ctx.runMutation(
				internal.tables.rewardClaims.mutations.releaseRewardClaim.releaseRewardClaim,
				{ claimId: order.claimId }
			);
		}

		// O7 — refund confirmation. `EmailSystemDesign.md` §5 O7. Idempotent seam: only reached
		// on the `paid → refunded` transition (a non-paid order threw above), so it fires once.
		void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
			kind: 'orderRefunded',
			orderId: order._id
		});

		return null;
	}
});
