// LIBRARIES
import { httpAction } from '@/convex/_generated/server';
import { internal } from '@/convex/_generated/api';

// CONFIG
import { FEATURES } from '@/shared/config.js';

/**
 * `POST /stripe/webhook` — money in (`StripeSystemDesign.md` §8). Registered in
 * `src/convex/http.ts`; this is the only public surface Stripe ever calls.
 *
 * Deliberately thin, and in the DEFAULT runtime (HTTP routes must be): it reads the raw body
 * **before any parsing** — the signature covers the exact bytes — and hands it to
 * `handleStripeEvent`, which runs in the Node runtime where the Stripe SDK lives. All
 * verification and the settlement decision tree happen there; this file only translates the
 * result into a status code.
 */
export const stripeWebhook = httpAction(async (ctx, request) => {
	if (!FEATURES.CHECKOUT) return new Response(null, { status: 404 });

	const signature = request.headers.get('stripe-signature');
	if (!signature) return new Response('missing stripe-signature header', { status: 400 });

	// Raw text, untouched — never `request.json()` here.
	const payload = await request.text();

	const { status } = await ctx.runAction(
		internal.tables.orders.actions.handleStripeEvent.handleStripeEvent,
		{ payload, signature }
	);

	return new Response(null, { status });
});
