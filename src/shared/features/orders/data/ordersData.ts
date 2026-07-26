// TYPES
import type { OrderStatus } from '@/shared/features/orders/types/ordersTypes';

/** All order statuses an admin can filter by, in the order filters/menus list them. Drives the
 *  URL-param parser (`parseAsStringLiteral`) and the filter select.
 *
 *  `draft` is deliberately absent: a draft is an unpaid online order that does not exist yet as
 *  far as the store is concerned, and `fetchOrders` never returns one (see `ordersSchema.ts`). */
export const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const satisfies readonly OrderStatus[];

/** Order status → Spanish label. `draft` is here only to keep the record total — an admin
 *  surface can never receive one, so it is a fallback, not a rendered state. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	draft: 'Borrador',
	pending: 'Pendiente',
	paid: 'Pagado',
	cancelled: 'Cancelado',
	refunded: 'Reembolsado'
};

/** Order status → badge classes (the colored pill in the admin table).
 *  Amber = the one needs-action state (unpaid); cancelled is a closed outcome, so it gets a
 *  muted burgundy tint — only refunded reads destructive. */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
	draft: 'bg-muted text-muted-foreground',
	pending: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
	paid: 'bg-chart-2/15 text-gold-ink',
	cancelled: 'bg-accent/10 text-accent',
	refunded: 'bg-destructive/10 text-destructive'
};
