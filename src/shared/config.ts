export const PAGINATION_DATA = {
	DEFAULT_PAGE_SIZE: 10,
	/** Server-side cap for `paginationOpts.numItems` (e.g. search dropdowns). */
	MAX_PAGE_SIZE: 25,
	/** Default for `DataTable` `optimizationStrategy` (see `DataTableOptimizationStrategy` in data-table `types.ts`). */
	DEFAULT_OPTIMIZATION_STRATEGY: 'cursor' as const
} as const;

const WHATSAPP_NUMBER = '524491234567';

/**
 * Branding / contact strings used by emails, headers, etc.
 * Single source of truth — imported by both client and Convex.
 */
export const COMPANY_DATA = {
	NAME: 'Vindima',
	EMAIL: 'hola@vindima.mx',
	RESEND_EMAIL: 'onboarding@resend.dev',
	DOMAIN: 'vindima.mx',
	LOGO: '/logo/opt/logo-1536w.webp',
	DESCRIPTION: 'Vinícola orgánica · vinos de autor, charcutería y experiencias para grandes anfitriones.',
	WHATSAPP_NUMBER,
	WHATSAPP_CONTACT_URL: `https://wa.me/${WHATSAPP_NUMBER}`,
	PHONE: '449 000 0000',
	OG_IMAGE: '/assets/og-image.png',
	OG_IMAGE_WIDTH: 1200,
	OG_IMAGE_HEIGHT: 630
} as const;

export const ASSETS_DATA = {
	BOARD: '/assets/board.png',
	BOTTLE_OUTLINE: '/assets/bottle-outline.png',
	BOTTLE: '/assets/bottle.png',
	BOWL_PLATTER: '/assets/bowl-platter.png',
	CHEESE: '/assets/cheese.png',
	DESSERT: '/assets/dessert.png',
	GLASS_SOFT: '/assets/glass-soft.png',
	GLASS: '/assets/glass.png',
	HOGAZA: '/assets/hogaza.png',
	OLIVE: '/assets/olive.png',
	OLIVES: '/assets/olives.png',
	TAPA: '/assets/tapa.png',
	WINE_BOTTLE: '/assets/wine-bottle.png'
} as const;

/**
 * Runtime feature flags. Toggle subsystems on/off in one place.
 * Evaluated at runtime in Convex functions and on the client.
 */
export const FEATURES = {
	/**
	 * Enable audit logging. When `false`, `ctx.audit()` / `logAudit()` are no-ops
	 * and nothing is written to the `auditLogs` table. The table itself is always
	 * declared in the schema so toggling this flag needs no migration.
	 */
	AUDIT_LOGS: true,

	/**
	 * Enable the punch-card rewards system. Tables stay declared; flipping needs no
	 * migration. When `false`: stamp/claim functions no-op, queries return null, crons
	 * exit, UI renders nothing. See `RewardSystem.md` and `REWARDS_CONFIG` below.
	 */
	REWARDS: true,

	/**
	 * Enable checkout + orders. Tables stay declared; flipping needs no migration. When
	 * `false`: `/checkout` renders nothing, `placeOrder` no-ops, the cart hides its Checkout
	 * button (the site becomes catalog-only). See `CheckoutPageSystemDesign.md` and
	 * `CHECKOUT_CONFIG` below.
	 */
	CHECKOUT: true
} as const;

/**
 * Storefront config — per-project knobs for what the public pages show.
 */
export const SHOP_CONFIG = {
	/**
	 * Hard cap on the categories the homepage shop section fetches, enforced server-side in
	 * `fetchCategoriesSafe`. The section is a menu overview, not a directory: past this many
	 * cards the grid stops reading as "pick one" and starts reading as a list to scroll.
	 * Extra categories stay fully reachable at their own `/shop/<slug>` pages.
	 */
	MAX_ROOT_CATEGORIES: 6
} as const;

/**
 * Punch-card rewards config — THE per-project knob (see `RewardSystem.md`).
 * Every value is an integer, string, or null (null = feature off). To retarget
 * this template for a new store, edit only this block (+ copy strings in the UI layer).
 *
 * Model: every qualifying paid order earns 1 stamp; `STAMPS_PER_REWARD` stamps
 * = 1 free item the customer picks from the admin-managed reward items (/admin/rewards).
 */
export const REWARDS_CONFIG = {
	/** Stamps needed to earn one free item. */
	STAMPS_PER_REWARD: 5,

	EARN: {
		/** Min order subtotal (minor units, after discounts, before shipping/tax) to earn a stamp. 0 = every order. */
		MIN_ORDER_MINOR_UNITS: 0,
		/** Days a stamp stays pending (return window). 0 = confirmed instantly. */
		PENDING_DAYS: 0,
		/** Orders containing a claimed free item still earn a stamp? Default true (generous, costs nothing). */
		STAMP_ON_REWARD_ORDERS: true
	},

	// Reward items (the free-item pool) are admin-managed in the DB — the `rewardEligible`
	// flag on variants, set from /admin/rewards. See RewardItemsSystemDesign.md.

	EXPIRY: {
		/** Card progress AND banked rewards reset after this many months of no activity. null = never. */
		INACTIVITY_MONTHS: 12 as number | null,
		/** Warn the user this many days before expiry (drives UI banner + optional email hook). */
		WARN_DAYS_BEFORE: 30
	},

	/**
	 * First-purchase discount ("welcome offer") — see RewardSystem.md §15. An add-on to the
	 * rewards module, gated independently of `FEATURES.REWARDS`: it's ON iff `DISCOUNT_PERCENT`
	 * is non-null. Auto-applied server-side to a user's first-ever paid order; one per account,
	 * forever (enforced by the immutable `firstPurchases` table, not by mutable eligibility).
	 */
	FIRST_PURCHASE: {
		/** Percent off the first-ever paid order. Integer 1–100. null = feature off. */
		DISCOUNT_PERCENT: 10 as number | null,
		/** Cap on the discount amount (minor units). null = uncapped. Protects against 10% of a huge order. */
		MAX_DISCOUNT_MINOR_UNITS: null as number | null,
		/** Require a verified email before the discount applies. Primary multi-account friction. */
		REQUIRE_VERIFIED_EMAIL: false
	}
} as const;

/**
 * Cart config — one of the ONLY TWO files a new project edits to adapt the cart:
 *   1. this block (currency + limits)
 *   2. the product map in `src/shared/features/cart/cartItems.ts` (refs → name/price/image)
 * Everything else (state, sidebar UI, Convex module) is universal and untouched.
 *
 * Guest carts live in `localStorage`; authenticated carts live in one Convex `carts`
 * doc per user. Prices are resolved app-side, so this module never assumes a catalog.
 * See `CartSystem.md`.
 */
export const CART_CONFIG = {
	/**
	 * Default ISO 4217 currency for prices (used when a product doesn't override it).
	 * Neutral template default — set this to the store's currency per project.
	 */
	CURRENCY: 'MXN',
	/** Max quantity per line. Stepper clamps to this; mutations enforce it server-side. */
	MAX_QTY_PER_LINE: 20,
	/** Max distinct lines per cart. Adds beyond this are rejected. */
	MAX_LINES: 50,
	/**
	 * Server cap for one `resolveCartProducts` request: `MAX_LINES` + the reward-claim ref,
	 * rounded up for headroom. A bigger batch can't come from a real cart, so the public
	 * resolver rejects it (`TOO_MANY_REFS`) before doing any DB reads. Keep > `MAX_LINES` + 1.
	 */
	MAX_RESOLVE_REFS: 64,
	/** Versioned localStorage key. Bump the suffix to invalidate old guest carts. */
	STORAGE_KEY: 'cart.v1',
	/** Debounce (ms) for coalescing quantity-stepper writes to the server. */
	STEPPER_DEBOUNCE_MS: 400
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
		DELIVERY: {
			/** Flat shipping fee, minor units. */
			FEE_MINOR_UNITS: 5000,
			/** Post-discount subtotal at which shipping becomes free. null = never free. */
			FREE_ABOVE_MINOR_UNITS: 50000 as number | null
		} as { FEE_MINOR_UNITS: number; FREE_ABOVE_MINOR_UNITS: number | null } | null
	},

	/**
	 * Payment provider, resolved by the adapter registry. `'manual'` = zero-config (order is
	 * placed `pending`, paid offline on pickup/delivery; staff settle it). `'redirect'` =
	 * hosted payment page — this project's redirect provider will be Stripe Checkout, chosen
	 * but not yet implemented; keep this on `'manual'` until the Stripe adapter lands.
	 */
	PAYMENT_PROVIDER: 'manual' as 'manual' | 'redirect',

	/**
	 * Settle a manual (offline-paid) order the moment it's placed — mark it paid and fire the
	 * reward side-effects (stamp, first-purchase record, claim) — instead of leaving it `pending`
	 * for staff to confirm. Useful before a real "confirm payment" admin flow (or Stripe) exists,
	 * so placing an order exercises the whole rewards path. No effect on `redirect` orders (those
	 * settle via the payment webhook). Set to `false` for a true pay-on-delivery model where
	 * rewards should only count once staff mark the order paid.
	 */
	SETTLE_ON_PLACE: true,

	/** Hours a `pending` order lives before the cron cancels it (and frees any reward claim). */
	PENDING_EXPIRY_HOURS: 48,

	/** Documentation, not a subsystem: prices are tax-inclusive. See spec §2. */
	TAX_MODE: 'included' as const
} as const;

/**
 * Routes instrumented by `initBotId` on the client and verified by
 * `checkBotId` on the server via `safeCommand`.
 *
 * SvelteKit remote functions POST to `/_app/remote/<hash>/call`. With locale
 * prefixes (Paraglide), the path becomes `/<locale>/_app/remote/<hash>/call`.
 */
export const BOTID_PROTECTED_ROUTES = [
	{ path: '/_app/remote/*', method: 'POST' as const },
	{ path: '/*/_app/remote/*', method: 'POST' as const }
];
