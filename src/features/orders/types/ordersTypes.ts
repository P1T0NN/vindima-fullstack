// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Display status the order UI renders (badge, styles, filter chips) — derived from
 * `Doc<'orders'>`: the fulfillment stages plus the terminal `cancelled` lifecycle state.
 * Computed client-side by `orderDisplayStatus` (status + fulfillment collapse); never stored.
 */
export type OrderDisplayStatus =
	| NonNullable<Doc<'orders'>['fulfillment']>
	| Extract<Doc<'orders'>['status'], 'cancelled'>;

export type OrderFilter = OrderDisplayStatus | 'all';
