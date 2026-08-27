/** Stripe Checkout settings. Secrets remain in Convex environment variables. */
export const STRIPE_CONFIG = {
	API_VERSION: '2026-06-24.dahlia',
	SESSION: {
		MAX_HOURS: 24,
		MIN_MINUTES: 30,
		CEILING_MARGIN_MINUTES: 1,
		ORDER_EXPIRY_MARGIN_HOURS: 1
	},
	ACCOUNT_BEHAVIOR: {
		ADAPTIVE_PRICING: false,
		AUTOMATIC_TAX: false
	},
	LABELS: {
		PICKUP: 'Recoger en tienda',
		SHIPPING: 'Envío',
		WELCOME_DISCOUNT: 'Descuento primer pedido'
	}
} as const;
