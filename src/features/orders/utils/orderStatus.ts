// The colored badge that wraps this label is inline at its single render site (the admin
// orders table) — promote it to an <OrderStatusBadge> when a second one appears.

// DATA
import {
	ORDER_STATUS_LABELS,
	ORDER_STATUS_BADGE_CLASSES
} from '@/shared/features/orders/data/ordersData';

// TYPES
import type { OrderStatus } from '@/shared/features/orders/types/ordersTypes';

export function orderStatusLabel(status: OrderStatus): string {
	return ORDER_STATUS_LABELS[status];
}

export function orderStatusBadgeClass(status: OrderStatus): string {
	return ORDER_STATUS_BADGE_CLASSES[status];
}

/** Narrow an arbitrary string (e.g. a URL param) to a known status, or null. */
export function toOrderStatus(value: string | null | undefined): OrderStatus | null {
	return value && value in ORDER_STATUS_LABELS ? (value as OrderStatus) : null;
}
