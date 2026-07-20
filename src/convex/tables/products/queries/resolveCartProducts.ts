/**
 * Public, bounded batch resolver (ProductsTableSystemDesign.md §5.2).
 *
 * Args `{ refs }` — rejects > 64 refs (`CART_CONFIG.MAX_LINES` + reward claim + headroom; a
 * bigger request is abuse, not a cart). No auth — product data is public. Returns the final
 * `ResolvedCartProduct` shape (display name already `name · label`); the client uses rows directly.
 *
 * Subscription discipline (§5): the cart sidebar subscribes with its line refs only while open;
 * the checkout page subscribes with cart refs + active claim ref. Live price edits push into open
 * carts/checkouts automatically. The checkout server reprices at placement regardless.
 */

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// HELPERS
import { resolveRefs } from '../helpers/resolveRefs';

/** Bigger than any legal cart (MAX_LINES 50 + a reward claim + headroom). */
const MAX_RESOLVE_REFS = 64;

export const resolveCartProducts = query({
	args: { refs: v.array(v.string()) },
	returns: v.array(
		v.object({
			productRef: v.string(),
			name: v.string(),
			imageUrl: v.union(v.string(), v.null()),
			unitPriceMinor: v.union(v.number(), v.null()),
			currency: v.string()
		})
	),
	handler: async (ctx, args) => {
		if (args.refs.length > MAX_RESOLVE_REFS) {
			throw new ConvexError({
				code: 'TOO_MANY_REFS',
				message: { key: 'ProductMessages.TOO_MANY_REFS' }
			});
		}
		return await resolveRefs(ctx, args.refs);
	}
});
