// DATA
import { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';

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
	return filter === 'all' ? 'All' : orderStatusLabel(filter);
}

/** `placedAt` (ms) → "12 Jul 2026" in the viewer's locale. */
export function formatOrderDate(ms: number): string {
	return new Intl.DateTimeFormat(undefined, {
		day: 'numeric',
		month: 'short',
		year: 'numeric'
	}).format(new Date(ms));
}

type PlaceOrderArgs = FunctionArgs<typeof api.tables.orders.mutations.placeOrder.placeOrder>;

/**
 * The flat place-order form model → `placeOrder`'s nested args. The form is flat (one key per
 * rendered field); the mutation wants `{ contact, delivery: { kind, address } }` plus two fields
 * that aren't form inputs — the idempotency `attemptId` and the cart `lines` — passed in and merged.
 */
export function toPlaceOrderArgs(
	values: PlaceOrderFormInput,
	attemptId: string,
	lines: { productRef: string; qty: number }[]
): PlaceOrderArgs {
	return {
		attemptId,
		lines,
		contact: { name: values.name, email: values.email, phone: values.phone || undefined },
		delivery:
			values.mode === 'pickup'
				? { kind: 'pickup' }
				: {
						kind: 'delivery',
						address: {
							line1: values.line1,
							line2: values.line2 || undefined,
							city: values.city,
							postcode: values.postcode,
							country: values.country
						}
					},
		note: values.note || undefined
	};
}
