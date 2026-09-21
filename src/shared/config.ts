const WHATSAPP_NUMBER = '5214499409233';

/** Address parts, kept separate because schema.org `PostalAddress` needs them individually. */
const ADDRESS = {
	STREET: 'Monte Everest 501',
	NEIGHBORHOOD: 'Los Bosques',
	POSTAL_CODE: '20120',
	CITY: 'Aguascalientes',
	REGION: 'Ags.',
	COUNTRY: 'México',
	/** ISO 3166-1 alpha-2, for `addressCountry`. */
	COUNTRY_CODE: 'MX'
} as const;

/**
 * Branding / contact strings used by emails, headers, etc.
 * Single source of truth — imported by both client and Convex.
 */
export const COMPANY_DATA = {
	NAME: 'Vindima',
	EMAIL: 'vindima.ags@gmail.com',
	RESEND_EMAIL: 'info@vindimawinebar.com',
	EMAIL_COPY: {
		FOOTER_NOTICE: 'You are receiving this email because of activity on your account.',
		IGNORE_NOTICE: 'If you did not request this email, you can safely ignore it.'
	},
	DOMAIN: 'vindimawinebar.com',
	LOGO: '/logo/opt/logo-640w.webp',
	DESCRIPTION:
		'Vinícola orgánica - vinos de autor, charcutería y experiencias para grandes anfitriones.',
	WHATSAPP_NUMBER,
	WHATSAPP_CONTACT_URL: `https://wa.me/${WHATSAPP_NUMBER}`,
	ADDRESS: {
		...ADDRESS,
		/** The two display lines, composed from the parts above so nothing is written twice. */
		LINE_1: `${ADDRESS.STREET}, ${ADDRESS.NEIGHBORHOOD}`,
		LINE_2: `${ADDRESS.POSTAL_CODE} ${ADDRESS.CITY}, ${ADDRESS.REGION}, ${ADDRESS.COUNTRY}`
	},
	/**
	 * Opening hours, one entry per day group. `DAYS`/`TIME` are display copy; `SCHEMA_DAYS`
	 * (English day names) and 24h `OPENS`/`CLOSES` feed the `openingHoursSpecification` in the
	 * home page's JSON-LD. Edit both halves of an entry together — nothing derives one from
	 * the other, since parsing display-formatted "1:00 PM" copy back into a machine time is more code
	 * than restating four characters.
	 */
	HOURS: [
		{
			DAYS: 'Martes',
			TIME: '1:00 PM - 9:15 PM',
			SCHEMA_DAYS: ['Tuesday'],
			OPENS: '13:00',
			CLOSES: '21:15'
		},
		{
			DAYS: 'Miércoles',
			TIME: '2:30 PM - 9:15 PM',
			SCHEMA_DAYS: ['Wednesday'],
			OPENS: '14:30',
			CLOSES: '21:15'
		},
		{
			DAYS: 'Jueves y Viernes',
			TIME: '1:00 PM - 11:00 PM',
			SCHEMA_DAYS: ['Thursday', 'Friday'],
			OPENS: '13:00',
			CLOSES: '23:00'
		},
		{
			DAYS: 'Sábado',
			TIME: '1:00 PM - 11:00 PM',
			SCHEMA_DAYS: ['Saturday'],
			OPENS: '13:00',
			CLOSES: '23:00'
		},
		{
			DAYS: 'Domingo',
			TIME: '1:00 PM - 6:30 PM',
			SCHEMA_DAYS: ['Sunday'],
			OPENS: '13:00',
			CLOSES: '18:30'
		}
	],
	INSTAGRAM_URL: 'https://www.instagram.com/vindima.ags/',
	PHONE: '+52 449 940 9233',
	OG_IMAGE: '/assets/og-image.png',
	OG_IMAGE_WIDTH: 1200,
	OG_IMAGE_HEIGHT: 630
} as const;

/**
 * Decorative art renders at ≤220px wide, so the 640w WebP variants are already
 * oversized for every call site — the raw PNGs (up to 917 KB each) stay in
 * `static/assets/` so they can be regenerated with `bun run optimize-images`.
 */
export const ASSETS_DATA = {
	BOARD: '/assets/opt/board-640w.webp',
	BOTTLE_OUTLINE: '/assets/opt/bottle-outline-640w.webp',
	BOTTLE: '/assets/opt/bottle-640w.webp',
	BOWL_PLATTER: '/assets/opt/bowl-platter-640w.webp',
	CHEESE: '/assets/opt/cheese-640w.webp',
	DESSERT: '/assets/opt/dessert-640w.webp',
	GLASS_SOFT: '/assets/opt/glass-soft-640w.webp',
	GLASS: '/assets/opt/glass-640w.webp',
	HOGAZA: '/assets/opt/hogaza-640w.webp',
	OLIVE: '/assets/opt/olive-640w.webp',
	OLIVES: '/assets/opt/olives-640w.webp',
	TAPA: '/assets/opt/tapa-640w.webp',
	WINE_BOTTLE: '/assets/opt/wine-bottle-640w.webp'
} as const;

/**
 * Runtime feature flags. Toggle subsystems on/off in one place.
 * Evaluated at runtime in Convex functions and on the client.
 */
export const FEATURES = {
	/**
	 * Enable the punch-card rewards system. Tables stay declared; flipping needs no
	 * migration. When `false`: stamp/claim functions no-op, queries return null, crons
	 * exit, UI renders nothing. See `RewardSystem.md` and the rewards feature config.
	 */
	REWARDS: true,

	/**
	 * Enable checkout + orders. Tables stay declared; flipping needs no migration. When
	 * `false`: `/checkout` renders nothing, `placeOrder` no-ops, the cart hides its Checkout
	 * button (the site becomes catalog-only). See `CheckoutPageSystemDesign.md` and
	 * `CHECKOUT_CONFIG` below.
	 */
	CHECKOUT: true,

	/**
	 * Enable transactional email (order/auth/reward notifications via Resend). When `false`,
	 * every send no-ops with a console log and no migration is needed — the whole pipeline
	 * (mutations, scheduler, templates) still runs, it just never calls Resend. See
	 * `EmailSystemDesign.md`. NOTE: this also gates the auth OTP emails, so turning it off
	 * breaks email sign-in — intended only for dev/testing without a Resend key.
	 */
	EMAILS: true,

	/**
	 * Enable add-to-cart upsell suggestions. Table stays declared; flipping needs no
	 * migration. When `false`: the `/admin/upsells` nav entry hides, `fetchUpsellCatalog`
	 * returns empty, no dialog ever mounts, and the add-to-cart flow behaves exactly as
	 * before the feature existed. See `UpsellsSystemDesign.md` and the upsells feature config.
	 */
	UPSELLS: true
} as const;

/**
 * Checkout config — the per-project knob for the single-page checkout (see
 * `CheckoutPageSystemDesign.md`). Prices/currency come from `CART_CONFIG` + the product
 * resolver; this block only shapes the flow (who can check out, how they receive the order,
 * what shipping costs, which payment provider settles it).
 */
export const CHECKOUT_CONFIG = {
	/** Allow checkout without an account. Rewards/welcome offer stay account-only regardless. */
	ALLOW_GUEST_CHECKOUT: true,

	FULFILLMENT: {
		/** Offer in-store/counter pickup (no address, no shipping fee). */
		PICKUP: true,
		/**
		 * Offer delivery (address form + the shipping fee below). Set to `null` to disable
		 * delivery entirely (pickup-only store).
		 */
		DELIVERY: null as { FEE_MINOR_UNITS: number; FREE_ABOVE_MINOR_UNITS: number | null } | null
	},

	/**
	 * Payment methods offered at checkout. Online payments use Stripe Checkout (hosted redirect,
	 * settled by webhook — see `StripeSystemDesign.md`). With one method enabled the checkout uses
	 * it directly.
	 *
	 * `ONLINE: true` REQUIRES two Convex env vars and one dashboard webhook per deployment
	 * (`StripeSystemDesign.md` §17): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and an endpoint
	 * at `https://<deployment>.convex.site/stripe/webhook`. Set it to `false` to disable checkout
	 * until Stripe is configured.
	 */
	PAYMENT_METHODS: {
		ONLINE: true
	},

	/** Hours an unpaid checkout stays open before the cron cancels or deletes it. */
	PENDING_EXPIRY_HOURS: 24,

	/** Documentation, not a subsystem: prices are tax-inclusive. See spec §2. */
	TAX_MODE: 'included' as const
} as const;

/**
 * Routes instrumented by `initBotId` on the client and verified by
 * `checkBotId` on the server via `safeCommand`.
 *
 * SvelteKit remote functions POST to `/_app/remote/<hash>/call`.
 */
export const BOTID_PROTECTED_ROUTES = [{ path: '/_app/remote/*', method: 'POST' as const }];
