'use node';

// LIBRARIES
import Stripe from 'stripe';

// CONFIG
import { STRIPE_CONFIG } from '@/shared/config.js';

/**
 * The ONE place a Stripe client is constructed (`StripeSystemDesign.md` §11).
 *
 * ## Module boundary
 * `src/convex/stripe/**` is the only code in the repo allowed to *value*-import the `stripe`
 * package:
 *   - `helpers/` — one file per Stripe operation (create/retrieve/expire session, coupon, refund,
 *     webhook verification). Plain functions, not Convex functions, hence `helpers/`.
 *   - `utils/`   — SDK-dependent predicates (`isStripeAlreadyDoneError`).
 *   - `actions/` — the one Convex action that is nothing but a Stripe operation.
 * Everything domain-shaped (orders, settlement, refund policy) lives in
 * `src/convex/tables/orders/**` and reaches Stripe only through those helpers. Pure Stripe math
 * and all Stripe *types* live in `src/shared/features/stripe/`, which is client-reachable and so
 * may only ever `import type` from the SDK.
 *
 * `'use node'` is required: the `stripe` package resolves to its Node build under Convex's
 * default-runtime bundler conditions (`["convex","module"]`), which pulls in node builtins. So
 * every module that touches Stripe runs in the Node runtime — all of them are actions, the only
 * Convex function type allowed there. The webhook HTTP action stays in the default runtime and
 * delegates to `handleStripeEvent` for exactly this reason.
 *
 * Every value setting comes from `STRIPE_CONFIG` in `src/shared/config.ts` — including the
 * pinned `API_VERSION`, so a Stripe API release can never change behaviour under an
 * already-deployed store. Only the two secrets live outside config, in Convex env.
 */
let cached: Stripe | null = null;

export function getStripe(): Stripe {
	if (cached) return cached;

	const apiKey = process.env.STRIPE_SECRET_KEY;
	// Fail loudly, naming the fix. A store that flipped PAYMENT_METHODS.ONLINE on without keys
	// must break at the first pay-page hit in dev — never silently fall back to something else.
	if (!apiKey) {
		throw new Error(
			'STRIPE_SECRET_KEY is not set on this Convex deployment. Run: ' +
				'npx convex env set STRIPE_SECRET_KEY sk_... (see StripeSystemDesign.md #17)'
		);
	}

	cached = new Stripe(apiKey, {
		apiVersion: STRIPE_CONFIG.API_VERSION,
		// Fetch client + SubtleCrypto webhook verification keep this module portable to a
		// non-Node runtime; both work as-is on Node 18+.
		httpClient: Stripe.createFetchHttpClient(),
		typescript: true
	});
	return cached;
}
