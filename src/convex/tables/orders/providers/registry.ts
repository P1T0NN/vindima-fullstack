// CONFIG
import { CHECKOUT_CONFIG } from '@/shared/config.js';

// PROVIDERS
import { manualProvider } from './manual';

// TYPES
import type { PaymentProvider } from './types';

/**
 * Resolve the payment provider named in `CHECKOUT_CONFIG.PAYMENT_PROVIDER`.
 *
 * `redirect` is Stripe Checkout for this project — decided but NOT yet implemented (see
 * `CheckoutPageSystemDesign.md` §8). Keep `PAYMENT_PROVIDER` on `'manual'` until the Stripe
 * adapter lands; selecting `'redirect'` before then throws on purpose rather than placing
 * orders no one can pay.
 */
export function getPaymentProvider(): PaymentProvider {
	switch (CHECKOUT_CONFIG.PAYMENT_PROVIDER) {
		case 'manual':
			return manualProvider;
		case 'redirect':
			throw new Error(
				'redirect payment provider (Stripe) not implemented — keep PAYMENT_PROVIDER = "manual"'
			);
		default: {
			const exhaustive: never = CHECKOUT_CONFIG.PAYMENT_PROVIDER;
			throw new Error(`unknown payment provider: ${String(exhaustive)}`);
		}
	}
}
