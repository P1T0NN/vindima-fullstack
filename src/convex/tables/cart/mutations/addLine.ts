// LIBRARIES
import { v, ConvexError } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '@/convex/auth/middleware/authMiddleware';

// CONFIG
import { CART_CONFIG } from '@/shared/config';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { upsertLine } from '@/shared/features/cart/cartUtils';
import { mutationResult } from '@/convex/helpers/mutationResult';

// TYPES
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Public (auth-gated) — add `qty` of a product to the cart. Upserts: existing line
 * gets `qty += n` (clamped to MAX_QTY_PER_LINE); a new line is appended unless the
 * cart is already at MAX_LINES, in which case it throws a translatable error the
 * client toasts. Lazily creates the cart doc. One atomic transaction.
 */
export const addLine = authMutation('addLine')({
	args: { productRef: v.string(), qty: v.number() },
	// Fire-and-forget write, but return the shared envelope (truthy) so `safeMutation`'s
	// null-on-handled-error sentinel can't be confused with a successful `null`.
	returns: mutationResult,
	handler: async (ctx, args) => {
		const cart = await loadCart(ctx, ctx.userId);
		const now = Date.now();

		const lines = upsertLine(
			cart?.lines ?? [],
			args.productRef,
			args.qty,
			now,
			CART_CONFIG.MAX_QTY_PER_LINE,
			CART_CONFIG.MAX_LINES,
			() => {
				throw new ConvexError({
					code: 'CART_FULL',
					message: { key: 'CartMessages.CART_FULL' }
				} satisfies ConvexErrorPayload);
			}
		);

		if (cart) {
			await ctx.db.patch(cart._id, { lines, updatedAt: now });
		} else {
			await ctx.db.insert('carts', { userId: ctx.userId, lines, updatedAt: now });
		}
		return { success: true, message: { key: 'GenericMessages.OK' } };
	}
});
