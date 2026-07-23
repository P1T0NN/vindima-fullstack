// TYPES
import type { OrderStatus } from '@/shared/features/orders/types/ordersTypes';

/** All order statuses, in the order filters/menus list them. Drives the URL-param parser
 *  (`parseAsStringLiteral`) and the filter select. */
export const ORDER_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const satisfies readonly OrderStatus[];

/** Order status → Spanish label. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
	pending: 'Pendiente',
	paid: 'Pagado',
	cancelled: 'Cancelado',
	refunded: 'Reembolsado'
};

/** Order status → badge classes (the colored pill in the admin table). */
export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
	pending: 'bg-muted text-muted-foreground',
	paid: 'bg-chart-2/15 text-chart-2',
	cancelled: 'bg-destructive/10 text-destructive',
	refunded: 'bg-destructive/10 text-destructive'
};
