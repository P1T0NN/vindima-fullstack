// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { BATCH_CONFIG, CHECKOUT_CONFIG, FEATURES } from '@/shared/config.js';

// HELPERS
import { orderCountAggregate } from '../helpers/orderCountAggregate';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';

const HOUR_MS = 60 * 60 * 1000;

/** Max orders cancelled per run — see `BATCH_CONFIG`. */
const EXPIRE_BATCH = BATCH_CONFIG.ORDER_EXPIRE;

/**
 * Cancel `pending` orders past their hold window, releasing any reward claim they hold so an
 * abandoned checkout can't keep a customer's free item hostage forever
 * (`CheckoutPageSystemDesign.md` §6.2). Two windows: online orders expire after
 * `PENDING_EXPIRY_HOURS_ONLINE` (an unpaid redirect is abandonment), cash orders after the
 * longer `PENDING_EXPIRY_HOURS` (the customer may still be coming). Scans the `by_status`
 * index, which orders pending orders oldest-first, so we stop at the first order younger
 * than the SHORTER window — nothing past it can exceed either. No-op when checkout is
 * disabled.
 *
 * Second job, same run: `sweepAbandonedDrafts` DELETES unpaid online drafts past the online
 * window. See that function for why deleting (rather than cancelling) is both correct and safe.
 */
export const expirePendingOrders = internalMutation({
	args: {},
	handler: async (ctx) => {
		if (!FEATURES.CHECKOUT) return { cancelled: 0, deleted: 0 };

		const now = Date.now();
		const cashCutoff = now - CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS * HOUR_MS;
		const onlineCutoff = now - CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS_ONLINE * HOUR_MS;
		const pending = await ctx.db
			.query('orders')
			.withIndex('by_status', (q) => q.eq('status', 'pending'))
			.take(EXPIRE_BATCH);

		let cancelled = 0;
		for (const order of pending) {
			if (order._creationTime >= onlineCutoff) break; // fresher than the shortest window
			// A missing paymentMethod is a pre-Stripe row: historical default `cash`.
			const cutoff = order.paymentMethod === 'online' ? onlineCutoff : cashCutoff;
			if (order._creationTime >= cutoff) continue; // cash order still inside its longer hold
			await ctx.db.patch(order._id, { status: 'cancelled' });
			// Work-queue counter: pending → closed.
			await orderCountAggregate.replaceOrInsert(ctx, order, (await ctx.db.get(order._id))!);
			if (order.claimId) {
				await ctx.runMutation(
					internal.tables.rewardClaims.mutations.releaseRewardClaim.releaseRewardClaim,
					{ claimId: order.claimId }
				);
			}

			// O6 — tell the customer their pending order expired. `EmailSystemDesign.md` §5 O6.
			void ctx.scheduler.runAfter(0, internal.emails.sendEmail.sendEmail, {
				kind: 'orderCancelled',
				orderId: order._id,
				cancelReason: 'expired'
			});

			cancelled++;
		}

		if (pending.length === EXPIRE_BATCH) {
			console.warn('[orders] expirePendingOrders hit batch cap', { batch: EXPIRE_BATCH });
		}

		const deleted = await sweepAbandonedDrafts(ctx, onlineCutoff);
		return { cancelled, deleted };
	}
});

/**
 * Abandoned drafts are **deleted**, not cancelled.
 *
 * A draft is an online order nobody ever paid for: no number was ever shown to anyone, no email
 * went out, no counter moved, no admin saw it. Leaving a `cancelled` row behind would invent a
 * record of an order that, by the rule this whole status exists to enforce, never happened — and
 * would pile up one dead row per abandoned checkout forever. So the row goes.
 *
 * **Why deleting cannot eat a real payment.** The same `PENDING_EXPIRY_HOURS_ONLINE` window
 * bounds both this sweep and `stripeSessionExpiresAt`, and the latter subtracts an hour: a
 * draft's Stripe session is guaranteed dead at least an hour before the draft is old enough to
 * be swept. The `expireCheckoutSession` call below is a second belt over that. And if a payment
 * somehow still landed, the webhook's "no matching order" branch auto-refunds it — the shopper
 * gets their money back without anyone noticing, which is the outcome we want for a charge
 * against an order that no longer exists.
 */
async function sweepAbandonedDrafts(ctx: MutationCtx, cutoff: number): Promise<number> {
	const drafts = await ctx.db
		.query('orders')
		.withIndex('by_status', (q) => q.eq('status', 'draft'))
		.take(EXPIRE_BATCH);

	let deleted = 0;
	for (const draft of drafts) {
		if (draft._creationTime >= cutoff) break; // index is oldest-first; nothing past here qualifies

		// Belt over the expires_at coupling: make sure nothing is left payable before the row it
		// would settle disappears. Commit-gated, and "already expired" counts as success.
		if (draft.paymentSessionRef) {
			void ctx.scheduler.runAfter(
				0,
				internal.stripe.actions.expireStripeSession.expireStripeSession,
				{ sessionRef: draft.paymentSessionRef }
			);
		}

		// The free item goes back to the customer's account before the draft holding it is gone.
		if (draft.claimId) {
			await ctx.runMutation(
				internal.tables.rewardClaims.mutations.releaseRewardClaim.releaseRewardClaim,
				{ claimId: draft.claimId }
			);
		}

		// Aggregate first — the counter is keyed by the doc, so it must go while the doc exists.
		await orderCountAggregate.deleteIfExists(ctx, draft);
		await ctx.db.delete(draft._id);

		// No O6: there is no order to tell the customer about. They were never emailed one.
		deleted++;
	}

	if (drafts.length === EXPIRE_BATCH) {
		console.warn('[orders] draft sweep hit batch cap', { batch: EXPIRE_BATCH });
	}
	return deleted;
}
