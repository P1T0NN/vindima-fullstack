// LIBRARIES
import { v, ConvexError } from 'convex/values';

// MIDDLEWARE
import { authenticatedMutation } from '@/convex/builders/convexFunctionBuilders';

// CONFIG
import { CART_CONFIG } from '@/shared/features/cart/config';

// HELPERS
import { loadCart } from '@/convex/tables/cart/helpers/loadCart';
import { upsertLine } from '@/shared/features/cart/cartUtils';
import { mutationResult } from '@/convex/validators/mutationResult';

// TYPES
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * Public (auth-gated) — add `qty` of a product to the cart. Upserts: existing line
 * gets `qty += n` (clamped to MAX_QTY_PER_LINE); a new line is appended unless the
 * cart is already at MAX_LINES, in which case it throws a display-ready error the
 * client toasts. Lazily creates the cart doc. One atomic transaction.
 */
export const addLine = authenticatedMutation({
	args: { productRef: v.string(), qty: v.number() },
	// Fire-and-forget write, but return the shared envelope (truthy) so the caller can
	// distinguish a handled failure from a successful no-op.
	returns: mutationResult,
	handler: async (ctx, args) => {
		const cart = await loadCart(ctx, ctx.identity.subject);
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
					message: 'Tu carrito está lleno. Quita un artículo antes de agregar otro.'
				} satisfies ConvexErrorPayload);
			}
		);

		if (cart) {
			await ctx.db.patch(cart._id, { lines, updatedAt: now });
		} else {
			await ctx.db.insert('carts', { userId: ctx.identity.subject, lines, updatedAt: now });
		}
		return { success: true, message: 'Listo.' };
	}
});
