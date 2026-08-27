// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authenticatedMutation } from '@/convex/builders/convexFunctionBuilders';

// CONFIG
import { CART_CONFIG } from '@/shared/features/cart/config';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { mergeLines } from '@/shared/features/cart/cartUtils';
import { mutationResult } from '@/convex/validators/mutationResult';

// SCHEMA
import { cartLineValidator } from '@/convex/tables/cart/schemas/cartSchema';

/**
 * Public (auth-gated) — merge a guest cart (from localStorage) into the server cart
 * on login/signup. Union by ref, `max(qty)` on collision, earlier `addedAt`, clamped
 * and truncated to config limits (see `mergeLines`). Idempotent — a double-fire from
 * a repeated auth event is a no-op. One atomic transaction.
 */
export const mergeGuestCart = authenticatedMutation({
	args: { lines: v.array(cartLineValidator) },
	// Returns the shared envelope (truthy) so the client can tell success from failure.
	returns: mutationResult,
	handler: async (ctx, args) => {
		const ok = { success: true, message: 'Listo.' } as const;
		if (args.lines.length === 0) return ok;

		const cart = await loadCart(ctx, ctx.identity.subject);
		const now = Date.now();
		const merged = mergeLines(
			cart?.lines ?? [],
			args.lines,
			CART_CONFIG.MAX_QTY_PER_LINE,
			CART_CONFIG.MAX_LINES
		);

		if (cart) {
			await ctx.db.patch(cart._id, { lines: merged, updatedAt: now });
		} else {
			await ctx.db.insert('carts', { userId: ctx.identity.subject, lines: merged, updatedAt: now });
		}
		return ok;
	}
});
