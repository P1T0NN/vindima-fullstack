// MIDDLEWARE
import { authenticatedMutation } from '@/convex/builders/convexFunctionBuilders';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { mutationResult } from '@/convex/validators/mutationResult';

/**
 * Public (auth-gated) — empty the cart. Called by checkout success. No-op if the
 * cart doc doesn't exist yet.
 */
export const clearCart = authenticatedMutation({
	args: {},
	returns: mutationResult,
	handler: async (ctx) => {
		const ok = { success: true, message: 'Listo.' } as const;
		const cart = await loadCart(ctx, ctx.identity.subject);
		if (!cart) return ok;
		await ctx.db.patch(cart._id, { lines: [], updatedAt: Date.now() });
		return ok;
	}
});
