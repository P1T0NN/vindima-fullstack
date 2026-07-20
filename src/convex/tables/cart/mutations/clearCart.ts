// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { mutationResult } from '@/convex/helpers/mutationResult';

/**
 * Public (auth-gated) — empty the cart. Called by checkout success. No-op if the
 * cart doc doesn't exist yet.
 */
export const clearCart = authMutation('clearCart')({
	args: {},
	returns: mutationResult,
	handler: async (ctx) => {
		const ok = { success: true, message: { key: 'GenericMessages.OK' } } as const;
		const cart = await loadCart(ctx, ctx.userId);
		if (!cart) return ok;
		await ctx.db.patch(cart._id, { lines: [], updatedAt: Date.now() });
		return ok;
	}
});
