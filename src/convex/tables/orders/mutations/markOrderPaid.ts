// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// ANALYTICS
import { analytics, ANALYTICS_EVENT } from '@/convex/analytics';

// HELPERS
import { orderCountAggregate } from '../helpers/orderCountAggregate';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';
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
		// Work-queue counter: pending → open (paid, not yet delivered).
		await orderCountAggregate.replaceOrInsert(ctx, order, (await ctx.db.get(order._id))!);

		// Analytics — order.settled + one order.line_sold per non-reward line (feeds the
		// admin dashboard). unique keys make webhook replays a no-op; the catch keeps a
		// misconfigured analytics component from ever rolling back a settlement.
		try {
			await trackSettlement(ctx, order);
		} catch (err) {
			console.warn('[orders] analytics track failed on settle; settling anyway', {
				orderId: order._id,
				err
			});
		}

		// Reward-line inputs for the receipt email (O2), captured across the stamp grant.
		let rewardStamps: number | undefined;
		let rewardCompleted: boolean | undefined;

		// Guest orders (userId null) earn no stamps, no welcome record, hold no claim.
		if (order.userId) {
			const userId = order.userId;

			// Snapshot the card before granting, so the email can report the stamp this order added.
			const beforeAccount = await ctx.db
				.query('rewardAccounts')
				.withIndex('by_user', (q) => q.eq('userId', userId))
				.unique();

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

			// Did this order confirm a stamp? (lifetimeStamps moves only on confirmation; a
			// still-pending stamp leaves it flat, so O2 shows no reward line — R1 handles it later.)
			const afterAccount = await ctx.db
				.query('rewardAccounts')
				.withIndex('by_user', (q) => q.eq('userId', userId))
				.unique();
			if (afterAccount && afterAccount.lifetimeStamps > (beforeAccount?.lifetimeStamps ?? 0)) {
				rewardStamps = afterAccount.stamps;
				rewardCompleted = afterAccount.availableRewards > (beforeAccount?.availableRewards ?? 0);
			}
		}

		// Email side effects — fire-and-forget, only on this fresh settlement (idempotent no-op
		// replays returned above). O2 = customer receipt, S1 = owner notification. See
		// `EmailSystemDesign.md` §4.2/§4.4. Scheduling is commit-gated, so a rollback sends nothing.
		void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
			kind: 'orderPaid',
			orderId: order._id,
			rewardStamps,
			rewardCompleted
		});
		void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
			kind: 'newOrderOwner',
			orderId: order._id
		});

		return null;
	}
});

/** Build + write the settlement analytics batch. Category resolves ref → variant → product
 *  at settle time (once per order) so dashboard breakdowns never need the join. */
async function trackSettlement(ctx: MutationCtx, order: Doc<'orders'>): Promise<void> {
	const actorId = order.userId ?? undefined;

	const lineEvents = [];
	for (const line of order.lines) {
		if (line.isRewardLine) continue;
		const variant = await ctx.db
			.query('productVariants')
			.withIndex('by_ref', (q) => q.eq('ref', line.productRef))
			.unique();
		const product = variant ? await ctx.db.get(variant.productId) : null;
		lineEvents.push({
			name: ANALYTICS_EVENT.ORDER_LINE_SOLD,
			actorId,
			properties: {
				revenueMinor: line.unitPriceMinor * line.qty,
				qty: line.qty,
				product: line.name,
				category: product?.category ?? 'otros'
			},
			unique: { key: `line-sold:${order._id}:${line.productRef}` }
		});
	}

	await analytics.track(ctx, {
		events: [
			{
				name: ANALYTICS_EVENT.ORDER_SETTLED,
				actorId,
				properties: { amountMinor: order.amounts.totalMinor, currency: order.currency },
				unique: { key: `order-settled:${order._id}` }
			},
			...lineEvents
		]
	});
}
