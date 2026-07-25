export const PAGINATION_DATA = {
	DEFAULT_PAGE_SIZE: 10,
	/** Server-side cap for `paginationOpts.numItems` (e.g. search dropdowns). */
	MAX_PAGE_SIZE: 25,
	/** Default for `DataTable` `optimizationStrategy` (see `DataTableOptimizationStrategy` in data-table `types.ts`). */
	DEFAULT_OPTIMIZATION_STRATEGY: 'cursor' as const
} as const;

/**
 * Server-side batch sizes for bulk work — one bounded batch per cron tick / request, never
 * a self-rescheduling loop. A full batch is the signal to raise the cron frequency or the
 * number here (the crons log a warning when they saturate).
 */
export const BATCH_CONFIG = {
	/** `confirmPendingStamps` — pending stamps promoted per hourly run (~4.8k/day headroom). */
	REWARD_STAMP_CONFIRM: 200,
	/** `expireInactiveCards` — inactive reward accounts wiped per daily run. */
	REWARD_CARD_EXPIRE: 500,
	/** `expirePendingOrders` — abandoned `pending` orders cancelled per run. */
	ORDER_EXPIRE: 200,
	/** `purgeStaleAuditLogs` — hard cap per run so a post-downtime backlog can't blow the budget. */
	AUDIT_PURGE: 5_000,
	/** `cleanupOrphanDataR2` — R2 metadata keys per page, and pages walked per run. Orphans past
	 *  `PAGE_SIZE * MAX_PAGES` wait for the next sweep. */
	R2_CLEANUP_PAGE_SIZE: 200,
	R2_CLEANUP_MAX_PAGES: 25,
	/** `createDeleteMutation` — default cap on `ids.length` per request. Overridable per call site. */
	DELETE_MUTATION: 200
} as const;

/**
 * Direct-to-R2 upload limits, enforced server-side before a signed URL is minted.
 * Mirrors historical Convex-storage limits — keep caps aligned so UX stays predictable.
 */
export const UPLOADS_CONFIG = {
	MAX_UPLOAD_BYTES: 10 * 1024 * 1024, // 10 MB
	ALLOWED_CONTENT_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
	/**
	 * Object-key prefixes clients may request, so bucket contents stay browsable by entity type
	 * (`products/<uuid>`) instead of a flat pile of UUIDs. Strict allowlist — a free-form prefix
	 * from the client would let a caller write anywhere in the bucket namespace.
	 *
	 * Keys are permanent: renaming a prefix here does NOT move existing objects, so add new
	 * values rather than editing old ones.
	 */
	ALLOWED_KEY_PREFIXES: ['products', 'categories']
} as const;

const WHATSAPP_NUMBER = '5214499409233';

/**
 * Branding / contact strings used by emails, headers, etc.
 * Single source of truth — imported by both client and Convex.
 */
export const COMPANY_DATA = {
	NAME: 'Vindima',
	EMAIL: 'info@kurosava.com',
	RESEND_EMAIL: 'info@kurosava.com',
	DOMAIN: 'vindima-fullstack.vercel.app',
	LOGO: '/logo/opt/logo-1536w.webp',
	DESCRIPTION:
		'Vinícola orgánica · vinos de autor, charcutería y experiencias para grandes anfitriones.',
	WHATSAPP_NUMBER,
	WHATSAPP_CONTACT_URL: `https://wa.me/${WHATSAPP_NUMBER}`,
	INSTAGRAM_URL: 'https://www.instagram.com/vindima.ags/',
	PHONE: '1 449 940 9233',
	OG_IMAGE: '/assets/og-image.png',
	OG_IMAGE_WIDTH: 1200,
	OG_IMAGE_HEIGHT: 630
} as const;

/**
 * Email palette — inline hex only, since email clients don't support CSS variables
 * (so these can't reference `layout.css` vars and are duplicated here on purpose).
 * Used by the transactional email header/footer templates.
 */
export const EMAIL_CONFIG = {
	/** Deep burgundy — header bar background, links. Mirrors `--accent`. */
	ACCENT: '#510128',
	/** Gold — wordmark. Mirrors `--primary`. */
	GOLD: '#d9af50',
	/** Page background around the 600px email. Mirrors `--background`. */
	BACKGROUND: '#f2f1ed',
	/** Footer panel background. Mirrors `--secondary`/`--muted`. */
	SURFACE: '#edebe3',
	/** Body card background (the middle of the sandwich). Mirrors `--card`. */
	CARD: '#fbfaf7',
	/** Primary body text + headings. Mirrors `--foreground`. */
	TEXT: '#1c1418',
	/** Muted text — taglines, legal line, secondary copy. Mirrors `--muted-foreground`. */
	MUTED_TEXT: 'rgba(28,20,24,0.6)',
	/** Text on the accent CTA button. Mirrors `--accent-foreground`. */
	ON_ACCENT: '#f2f1ed',
	/** Serif stack — matches the header wordmark. Email-safe families only. */
	FONT_SERIF: "Georgia,'Times New Roman',serif",
	/** Sans stack — the body default. */
	FONT_SANS: 'Arial,Helvetica,sans-serif',
	/**
	 * Minutes an OTP stays valid, as printed in the auth emails. This is COPY, not enforcement:
	 * the real window is better-auth's `emailOTP.expiresIn` (left at its 5-minute default).
	 * Bump both together.
	 */
	OTP_EXPIRY_MINUTES: 5
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
	 * before the feature existed. See `UpsellsSystemDesign.md` and `UPSELLS_CONFIG` below.
	 */
	UPSELLS: true
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
	MAX_ROOT_CATEGORIES: 6,
	/**
	 * Store-local day boundaries for the admin dashboard (period windows), as a fixed UTC
	 * offset in minutes. -360 = UTC-6 (Mexico City, no DST since 2022). Analytics rollups
	 * are hourly, so windows built from these midnights are exact.
	 * ponytail: fixed offset, swap to an IANA-timezone computation if a store with DST needs it.
	 */
	DASHBOARD_UTC_OFFSET_MINUTES: -360,
	/**
	 * Server-side bound on the products one `/shop/[category]` page returns (all at once,
	 * no pagination — a storefront category is a scrollable menu, not a directory). Far above
	 * any realistic catalog; raise it before a category legitimately outgrows it.
	 */
	MAX_PRODUCTS_PER_CATEGORY: 200,
	/** Newest orders shown in compact surfaces (account club-card history strip). Server-side `take`. */
	MY_ORDERS_PREVIEW_LIMIT: 3
} as const;

/**
 * Catalog shape knobs — products, variants, generated slugs. Server-side bounds, not UI.
 */
export const CATALOG_CONFIG = {
	/**
	 * Server-side `take` bound when joining a product's variants. One variant axis per product
	 * (`ProductsTableSystemDesign.md` §2), so a handful of rows at most — this is a safety cap,
	 * not a page size.
	 */
	MAX_VARIANTS_PER_PRODUCT: 64,
	/** Base for a generated product slug when the name has no slug-able characters at all. */
	SLUG_FALLBACK_BASE: 'producto',
	/** Numeric slug suffixes tried before falling back to a timestamp. */
	SLUG_SUFFIX_LIMIT: 50
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
	 * Payment methods offered at checkout — the shopper picks one as a card (spec §8.1). The
	 * provider registry maps method → settlement provider: `CASH` → the manual provider (order
	 * placed `pending`, paid offline on pickup/delivery; staff settle it), `ONLINE` → Stripe
	 * Checkout (hosted redirect, settled by webhook — see `StripeSystemDesign.md`). With a single
	 * method enabled the checkout shows no picker and uses it directly.
	 *
	 * `ONLINE: true` REQUIRES two Convex env vars and one dashboard webhook per deployment
	 * (`StripeSystemDesign.md` §17): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and an endpoint
	 * at `https://<deployment>.convex.site/stripe/webhook`. Set it back to `false` for a
	 * cash-only store: the card renders disabled ("Próximamente") and the server rejects the
	 * method, so no shopper can reach a dead payment path.
	 */
	PAYMENT_METHODS: {
		CASH: true,
		ONLINE: true
	},

	/**
	 * Settle a manual (offline-paid) order the moment it's placed — mark it paid and fire the
	 * reward side-effects (stamp, first-purchase record, claim) — instead of leaving it `pending`
	 * for staff to confirm. Useful before a real "confirm payment" admin flow (or Stripe) exists,
	 * so placing an order exercises the whole rewards path. No effect on `redirect` orders (those
	 * settle via the payment webhook). Set to `false` for a true pay-on-delivery model where
	 * rewards should only count once staff mark the order paid.
	 */
	SETTLE_ON_PLACE: false,

	/** Hours a `pending` order lives before the cron cancels it (and frees any reward claim). */
	PENDING_EXPIRY_HOURS: 48,

	/** Documentation, not a subsystem: prices are tax-inclusive. See spec §2. */
	TAX_MODE: 'included' as const
} as const;

/**
 * Stripe Checkout config — every Stripe value setting in one place (see
 * `StripeSystemDesign.md`). Reached only when a shopper picks `CHECKOUT_CONFIG.PAYMENT_METHODS
 * .ONLINE`; a cash-only store ignores this block entirely.
 *
 * Secrets are NOT here and never can be: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` live in
 * Convex env (`npx convex env set …`, §17). This file is bundled to the browser.
 *
 * Nothing here is account-scoped either — no `price_…`/`coupon_…`/`acct_…` ids — which is what
 * makes swapping Stripe accounts a two-env-var change (§2, the Portability Contract).
 */
export const STRIPE_CONFIG = {
	/**
	 * Stripe API version, pinned so a Stripe release can never change behaviour under an
	 * already-deployed store. Must match what the installed `stripe` package ships (its types
	 * only describe that one version) — bump this together with the package, never alone.
	 */
	API_VERSION: '2026-06-24.dahlia',

	/**
	 * Checkout Session lifetime (§7.3.4). The rule the session builder applies:
	 * `expires_at = min(now + MAX_HOURS, order expiry − ORDER_EXPIRY_MARGIN_HOURS)`.
	 */
	SESSION: {
		/** Stripe PLATFORM limit — the longest a session may live. Not a preference; raising it
		 *  makes Stripe reject the call. */
		MAX_HOURS: 24,
		/** Stripe PLATFORM limit — the shortest a session may live. Below this we refuse to create
		 *  one and tell the shopper to place a fresh order. */
		MIN_MINUTES: 30,
		/** Our safety margin against the ceiling, so second-rounding can't land 1s past Stripe's
		 *  24h limit. */
		CEILING_MARGIN_MINUTES: 1,
		/**
		 * Our safety margin against the ORDER's own expiry: a payment session always dies this
		 * long before `expirePendingOrders` may cancel its order. Load-bearing — it is why the
		 * cron needs zero Stripe awareness and can never cancel an order mid-payment. Only
		 * shorten it if the cron interval shortens too.
		 */
		ORDER_EXPIRY_MARGIN_HOURS: 1
	},

	/**
	 * Per-account Stripe behaviours we pin, so identical code charges an identical number on ANY
	 * Stripe account instead of inheriting each dashboard's settings (§2).
	 *
	 * ⚠ Both are coupled to the §7.4 amount assertion: the session's `amount_total` must equal
	 * the order's `totalMinor`, or no payment URL is handed out. Enabling either makes Stripe add
	 * to or re-present that total, so flipping one here REQUIRES revisiting that assertion (and,
	 * for tax, `CHECKOUT_CONFIG.TAX_MODE` + how catalog prices are entered).
	 */
	ACCOUNT_BEHAVIOR: {
		/** Re-present the total in the shopper's local currency. Off: this template is
		 *  deliberately single-currency (`CART_CONFIG.CURRENCY`). */
		ADAPTIVE_PRICING: false,
		/** Let Stripe Tax ADD tax on top. Off: prices here are tax-inclusive, so the order total
		 *  is already final. */
		AUTOMATIC_TAX: false
	},

	/**
	 * Copy rendered on Stripe's hosted page — the one surface whose text we send to a third party
	 * instead of rendering ourselves (same category as email templates, which are the documented
	 * exception in `GeneralSystemDesignRule.md` § backend returns data). Line-item names are NOT
	 * here: those are the order's frozen snapshot names.
	 */
	LABELS: {
		/** Shipping row for a pickup order (always 0 — shown so the total itemises honestly). */
		PICKUP: 'Recoger en tienda',
		/** Shipping row for a delivery order. */
		SHIPPING: 'Envío',
		/** Name of the ad-hoc first-purchase coupon (§7.2). */
		WELCOME_DISCOUNT: 'Descuento primer pedido'
	}
} as const;

/**
 * Add-to-cart upsell suggestions — per-project knobs. See `UpsellsSystemDesign.md` §4.2.
 * Gated by `FEATURES.UPSELLS`.
 */
export const UPSELLS_CONFIG = {
	/** Max items one rule may offer (and the dialog may show). 3–4 reads as a suggestion; more
	 *  reads as a second catalog. Enforced in the zod schema AND the mutations. */
	MAX_ITEMS_PER_RULE: 4,
	/** Show a given rule's dialog at most once per browser session (sessionStorage). `false` =
	 *  every matching add fires it — the current choice: the popup appears on every add of a
	 *  product that has upsells. */
	SHOW_ONCE_PER_SESSION: false,
	/** Versioned sessionStorage key holding the ids of rules already shown (§5.4). Bump to reset. */
	SHOWN_STORAGE_KEY: 'upsells.shown.v1'
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
