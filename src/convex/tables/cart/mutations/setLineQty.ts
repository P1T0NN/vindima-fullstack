// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { authenticatedMutation } from '@/convex/builders/convexFunctionBuilders';

// CONFIG
import { CART_CONFIG } from '@/shared/features/cart/config';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { setLineQty as setLineQtyPure } from '@/shared/features/cart/cartUtils';
import { mutationResult } from '@/convex/validators/mutationResult';

/**
 * Public (auth-gated) — set a line's absolute quantity. `0` removes the line.
 * Absolute (not delta) so retries and out-of-order delivery are idempotent.
 * Clamps to MAX_QTY_PER_LINE; no-op on an unknown ref or missing cart.
 */
export const setLineQty = authenticatedMutation({
	args: { productRef: v.string(), qty: v.number() },
	returns: mutationResult,
	handler: async (ctx, args) => {
		const ok = { success: true, message: 'Listo.' } as const;
		const cart = await loadCart(ctx, ctx.identity.subject);
		if (!cart) return ok;

		const lines = setLineQtyPure(
			cart.lines,
			args.productRef,
			args.qty,
			CART_CONFIG.MAX_QTY_PER_LINE
		);
		await ctx.db.patch(cart._id, { lines, updatedAt: Date.now() });
		return ok;
	}
});
