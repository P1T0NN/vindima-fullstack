// TYPES
import type { OrderDisplayStatus } from '@/features/orders/types/ordersTypes.js';

/** Stable order for status filter chips. Needs-action first. */
export const ORDER_FILTER_STATUS_ORDER: OrderDisplayStatus[] = [
	'unpaid',
	'processing',
	'shipped',
	'delivered',
	'cancelled'
];

/**
 * Status pill presentation — colour/label is purely visual.
 *
 * Colour carries one meaning here: **amber is the only state that asks the shopper to do
 * something.** `unpaid` takes it; `processing` steps back to a quiet brand tint, because an
 * order being prepared needs no action and shouldn't compete for attention with one that does.
 */
export const ORDER_STATUS_STYLES: Record<OrderDisplayStatus, { label: string; class: string }> = {
	unpaid: {
		label: 'Pago pendiente',
		class: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
	},
	processing: {
		label: 'En proceso',
		class: 'bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-foreground'
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
