// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// CONFIG
import { CART_CONFIG } from '@/shared/config';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { mergeLines } from '@/shared/features/cart/cartUtils';
import { mutationResult } from '@/convex/helpers/mutationResult';

// SCHEMA
import { cartLineValidator } from '@/convex/tables/cart/schemas/cartSchema';

/**
 * Public (auth-gated) — merge a guest cart (from localStorage) into the server cart
 * on login/signup. Union by ref, `max(qty)` on collision, earlier `addedAt`, clamped
 * and truncated to config limits (see `mergeLines`). Idempotent — a double-fire from
 * a repeated auth event is a no-op. One atomic transaction.
 */
export const mergeGuestCart = authMutation('mergeGuestCart')({
	args: { lines: v.array(cartLineValidator) },
	// Returns the shared envelope (truthy) so the client can tell success from a
	// handled error (safeMutation returns null on caught/toasted errors).
	returns: mutationResult,
	handler: async (ctx, args) => {
		const ok = { success: true, message: { key: 'GenericMessages.OK' } } as const;
		if (args.lines.length === 0) return ok;

		const cart = await loadCart(ctx, ctx.userId);
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
			await ctx.db.insert('carts', { userId: ctx.userId, lines: merged, updatedAt: now });
		}
		return ok;
	}
});
