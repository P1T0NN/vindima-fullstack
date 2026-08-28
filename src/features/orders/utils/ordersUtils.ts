// DATA
import { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';

// UTILS
import { INTL_LOCALE } from '@/utils/intlLocale';

// TYPES
import type { OrderDisplayStatus } from '@/features/orders/types/ordersTypes.js';
import type { OrderFilter } from '@/features/orders/types/ordersTypes.js';
import type { PlaceOrderFormInput } from '@/shared/features/orders/schemas/ordersSchemas.js';
import type { FunctionArgs } from 'convex/server';
import type { api } from '@/convex/_generated/api';

export function orderStatusLabel(status: OrderDisplayStatus): string {
	return ORDER_STATUS_STYLES[status].label;
}

export function orderFilterLabel(filter: OrderFilter): string {
	return filter === 'all' ? 'Todos' : orderStatusLabel(filter);
}

/** `placedAt` (ms) → a Spanish short date such as "12 jul 2026". */
export function formatOrderDate(ms: number): string {
	return new Intl.DateTimeFormat(INTL_LOCALE, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(ms));
}

type PlaceOrderArgs = FunctionArgs<typeof api.tables.orders.mutations.placeOrder.placeOrder>;

/**
 * The flat pickup-only place-order form model → `placeOrder`'s nested args. The mutation also
 * receives the idempotency `attemptId` and cart `lines` from the checkout flow.
 */
export function toPlaceOrderArgs(
	values: PlaceOrderFormInput,
	attemptId: string,
	lines: { productRef: string; qty: number }[],
	pickupSchedule?: { pickupDate: string; pickupTime: string }
): PlaceOrderArgs {
	return {
		attemptId,
		lines,
		contact: { name: values.name, email: values.email, phone: values.phone },
		paymentMethod: values.payment,
		delivery: {
			kind: 'pickup',
			pickupDate: pickupSchedule?.pickupDate ?? '',
			pickupTime: pickupSchedule?.pickupTime ?? ''
		},
		note: values.note || undefined
	};
}
