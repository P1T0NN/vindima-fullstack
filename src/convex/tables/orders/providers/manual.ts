// TYPES
import type { PaymentProvider } from './types';

/**
 * Manual provider (default, zero-config). The order is placed `pending` and settled offline
 * — staff confirm the payment on pickup/delivery, which calls `markOrderPaid` from an admin
 * surface. No external API, no keys, works on first clone. Matches counter-service retail.
 */
export const manualProvider: PaymentProvider = {
	async createPayment() {
		return { kind: 'none' };
	}
};
