// PROVIDERS
import { manualProvider } from './manual';
import { stripeProvider } from './stripe';

// TYPES
import type { PaymentProvider } from './types';
import type { Infer } from 'convex/values';
import type { orderPaymentMethodValidator } from '../validators/ordersValidators';

type PaymentMethod = Infer<typeof orderPaymentMethodValidator>;

/**
 * Resolve the settlement provider for an order's chosen payment method (checkout spec §8/§8.1).
 *
 * `cash` settles offline (staff confirm, or `SETTLE_ON_PLACE`); `online` is Stripe Checkout —
 * a redirect to our own pay page, which mints the hosted session (`StripeSystemDesign.md` §5).
 * Which methods a shopper may actually pick is gated by `CHECKOUT_CONFIG.PAYMENT_METHODS`
 * (disabled card in the UI + the server-side check in `placeOrder`), not here.
 */
export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
	switch (method) {
		case 'cash':
			return manualProvider;
		case 'online':
			return stripeProvider;
		default: {
			const exhaustive: never = method;
			throw new Error(`unknown payment method: ${String(exhaustive)}`);
		}
	}
}
