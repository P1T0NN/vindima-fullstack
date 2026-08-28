// PROVIDERS
import { stripeProvider } from './stripe';

// TYPES
import type { PaymentProvider } from './types';
import type { Infer } from 'convex/values';
import type { orderPaymentMethodValidator } from '../validators/ordersValidators';

type PaymentMethod = Infer<typeof orderPaymentMethodValidator>;

/**
 * Resolve the settlement provider for an order's chosen payment method (checkout spec §8/§8.1).
 *
 * `online` is Stripe Checkout — a redirect to our own pay page, which mints the hosted session
 * (`StripeSystemDesign.md` §5). Whether checkout is enabled is gated by
 * `CHECKOUT_CONFIG.PAYMENT_METHODS`, not here.
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
	switch (method) {
		case 'online':
			return stripeProvider;
		default: {
			const exhaustive: never = method;
			throw new Error(`unknown payment method: ${String(exhaustive)}`);
		}
	}
}
