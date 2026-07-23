// PROVIDERS
import { manualProvider } from './manual';

// TYPES
import type { PaymentProvider } from './types';
import type { Infer } from 'convex/values';
import type { orderPaymentMethodValidator } from '../validators/ordersValidators';

type PaymentMethod = Infer<typeof orderPaymentMethodValidator>;

/**
 * Resolve the settlement provider for an order's chosen payment method (spec §8 / §8.1).
 *
 * `online` is Stripe Checkout for this project — decided but NOT yet implemented. It stays
 * unreachable via `CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE = false` (the card renders disabled)
 * plus the server-side enabled-method guard in `placeOrder`; this throw is the last line of
 * defense rather than a path any shopper can take.
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
	switch (method) {
		case 'cash':
			return manualProvider;
		case 'online':
			throw new Error(
				'online payment (Stripe) not implemented — keep PAYMENT_METHODS.ONLINE = false'
			);
		default: {
			const exhaustive: never = method;
			throw new Error(`unknown payment method: ${String(exhaustive)}`);
		}
	}
}
