// LIBRARIES
import { v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// TYPES
import type { ConvexMutationResult } from '@/shared/types/types';

/**
 * Admin-facing refund. Soft-checks the order (exists, currently `paid`) so the dialog gets
 * the normal `{ success, message }` envelope, then reverses the settlement via the internal
 * `markOrderRefunded` (`paid → refunded` + stamp revoke; deliberately no welcome-offer restore
 * and no applied-claim clawback — RewardSystem.md §6/§9/§15.7).
 *
 * Two paths by payment method (`StripeSystemDesign.md` §9.1):
 * - **cash** (or any order without a `paymentRef`): flip now. There is no online payment to
 *   reverse; the refund is coordinated offline, exactly as the O7 email already says.
 * - **online**: **money moves first, status follows.** We only schedule the Stripe refund here
 *   and report `ORDER_REFUND_STARTED`; `refundStripePayment` flips the order once Stripe
 *   confirms. If Stripe fails, the order stays `paid` — the truth — and the admin retries.
 *   Flipping first would put a lie in the books.
 */
export const refundOrder = adminMutation('refundOrder')({
	args: { orderId: v.id('orders') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const order = await ctx.db.get(args.orderId);
		if (!order) {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_FOUND' } };
		}
		if (order.status !== 'paid') {
			return { success: false, message: { key: 'CheckoutMessages.ORDER_NOT_PAID' } };
		}

		const refundsOnline = order.paymentMethod === 'online' && !!order.paymentRef;

		// Audit the admin's decision either way — the request is the auditable act; the outcome
		// lands in the order's own status.
		ctx.audit(AUDIT_ACTIONS.ORDER_REFUND, {
			resource: { table: 'orders', id: order._id },
			after: { number: order.number, totalMinor: order.amounts.totalMinor }
		});

		if (refundsOnline) {
			await ctx.scheduler.runAfter(
				0,
				internal.tables.orders.actions.refundStripePayment.refundStripePayment,
				{ orderId: order._id }
			);
			return { success: true, message: { key: 'CheckoutMessages.ORDER_REFUND_STARTED' } };
		}

		await ctx.runMutation(internal.tables.orders.mutations.markOrderRefunded.markOrderRefunded, {
			orderId: order._id
		});

		return { success: true, message: { key: 'CheckoutMessages.ORDER_REFUNDED' } };
	}
});
