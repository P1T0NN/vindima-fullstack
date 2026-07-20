// TYPES
import type { OrderDisplayStatus } from '@/features/orders/types/ordersTypes.js';

/** Stable order for status filter chips. */
export const ORDER_FILTER_STATUS_ORDER: OrderDisplayStatus[] = [
	'processing',
	'shipped',
	'delivered',
	'cancelled'
];

/** Status pill presentation — colour/label is purely visual. */
export const ORDER_STATUS_STYLES: Record<OrderDisplayStatus, { label: string; class: string }> = {
	processing: {
		label: 'En proceso',
		class: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
	},
	shipped: {
		label: 'Enviado',
		class: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
	},
	delivered: {
		label: 'Entregado',
		class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
	},
	cancelled: {
		label: 'Cancelado',
		class: 'bg-muted text-muted-foreground'
	}
};
