// PURE
import { orderDisplayStatus } from '@/shared/features/checkout/utils/checkoutUtils';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * The customer-facing projection of an order — everything the confirmation / tracking page
 * renders, and nothing else. Shared by `fetchOrder` (by id) and `fetchOrderByNumber` (by the
 * number printed on the receipt) so the two entry points can never drift apart.
 *
 * Deliberately omits the internals a shopper has no business seeing: `attemptId`, `paymentRef`,
 * `paymentSessionRef`, `searchText`, `userId`.
 */
export function orderDetail(order: Doc<'orders'>) {
	return {
		id: order._id,
		number: order.number,
		placedAt: order._creationTime,
		status: order.status,
		displayStatus: orderDisplayStatus(order.status, order.fulfillment, order.paymentMethod),
		fulfillment: order.fulfillment,
		email: order.email,
		name: order.name,
		phone: order.phone ?? null,
		lines: order.lines,
		amounts: order.amounts,
		currency: order.currency,
		delivery: order.delivery,
		note: order.note ?? null,
		/** True while money is still owed — `draft` (online, unpaid) or `pending` (cash, or a
		 *  pre-draft-rule online row). */
		paymentPending: order.status === 'pending' || order.status === 'draft',
		/** Raw field passthrough — lets the UI tell "awaiting the webhook" from "pay at pickup". */
		paymentMethod: order.paymentMethod ?? 'cash'
	};
}

/**
 * Possession check for a guest order: the caller must present the same email the order carries.
 * Case- and whitespace-insensitive, because the shopper is retyping it from memory.
 */
export function guestEmailMatches(order: Doc<'orders'>, email: string | undefined): boolean {
	if (!email) return false;
	return email.trim().toLowerCase() === order.email.toLowerCase();
}
