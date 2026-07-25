// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { OrderStatus } from '@/shared/features/orders/types/ordersTypes';

/**
 * Display status the order UI renders (badge, styles, filter chips) — derived from
 * `Doc<'orders'>`: the fulfillment stages, the terminal `cancelled` lifecycle state, and
 * `unpaid`. Computed client-side by `orderDisplayStatus`; never stored.
 *
 * `unpaid` exists because "placed but never paid" is a genuinely different situation from
 * "we're preparing it": the shopper left the hosted payment page, and the only useful thing
 * the UI can do is offer to finish. Collapsing it into `processing` told them their order was
 * underway when nothing had been paid and nothing was being prepared.
 */
export type OrderDisplayStatus =
	| NonNullable<Doc<'orders'>['fulfillment']>
	| Extract<OrderStatus, 'cancelled'>
	| 'unpaid';

export type OrderFilter = OrderDisplayStatus | 'all';
