// CONFIG
import { CHECKOUT_CONFIG } from '@/shared/config.js';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { OrderDisplayStatus } from '@/features/orders/types/ordersTypes.js';
import type { OrderStatus } from '@/shared/features/orders/types/ordersTypes.js';

/**
 * Pure checkout math (see `CheckoutPageSystemDesign.md` §5). No Convex ctx, no I/O — every
 * function is a total function of its inputs (and `CHECKOUT_CONFIG`), so `calculateOrderPrice` on the
 * server and the checkout page on the client compute the same breakdown to the cent. All
 * money is integer minor units; there is no float arithmetic in the checkout module.
 */

export type DeliveryKind = 'pickup' | 'delivery';

/**
 * Shipping fee in minor units. Pickup is always free; delivery charges the flat fee unless
 * the POST-DISCOUNT subtotal has crossed the free-shipping threshold. Returns 0 whenever
 * delivery is disabled in config (defensive — placement also rejects a disabled kind).
 */
export function shippingFeeMinor(kind: DeliveryKind, postDiscountSubtotalMinor: number): number {
	if (kind !== 'delivery') return 0;
	const delivery = CHECKOUT_CONFIG.FULFILLMENT.DELIVERY;
	if (!delivery) return 0;
	if (
		delivery.FREE_ABOVE_MINOR_UNITS !== null &&
		postDiscountSubtotalMinor >= delivery.FREE_ABOVE_MINOR_UNITS
	) {
		return 0;
	}
	return delivery.FEE_MINOR_UNITS;
}

/** The one number charged. Never below 0 (a discount can't exceed subtotal in practice). */
export function orderTotalMinor(
	subtotalMinor: number,
	welcomeDiscountMinor: number,
	shippingMinor: number
): number {
	return Math.max(0, subtotalMinor - welcomeDiscountMinor + shippingMinor);
}

/**
 * Collapse (lifecycle status, fulfillment, payment method) into the single badge the account UI
 * shows (spec §4.2). Cancelled and refunded both read as "cancelled"; paid orders read as their
 * fulfillment stage. Types come straight from `Doc<'orders'>` (source of truth) and the derived
 * `OrderDisplayStatus` in `ordersTypes.ts`.
 *
 * `draft` — an online order that has not been paid yet — is `unpaid` by definition. It reaches
 * this function on exactly one surface, the success page mid-webhook, since no list ever carries
 * a draft (`ordersSchema.ts`).
 *
 * `paymentMethod` splits the one case that used to be misreported. A `pending` order means two
 * opposite things depending on how it is paid:
 *   - **cash** — confirmed, we're preparing it, the shopper pays on pickup/delivery → `processing`.
 *   - **online** — the shopper left the hosted payment page and nothing was charged → `unpaid`.
 * Since online orders are now placed as `draft`, that second case only remains reachable for
 * rows placed before the draft rule shipped; it is kept so their history still reads honestly.
 *
 * Optional so pre-existing callers and rows without the field keep the historical `cash`
 * behaviour.
 */
export function orderDisplayStatus(
	status: OrderStatus,
	fulfillment: Doc<'orders'>['fulfillment'],
	paymentMethod?: Doc<'orders'>['paymentMethod']
): OrderDisplayStatus {
	if (status === 'cancelled' || status === 'refunded') return 'cancelled';
	if (status === 'draft') return 'unpaid';
	if (status === 'pending' && paymentMethod === 'online') return 'unpaid';
	if (status === 'paid' && (fulfillment === 'shipped' || fulfillment === 'delivered')) {
		return fulfillment;
	}
	return 'processing';
}
