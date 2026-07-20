/**
 * Public, bounded batch resolver (ProductsTableSystemDesign.md §5.2).
 *
 * Args `{ refs }` — rejects more than `CART_CONFIG.MAX_RESOLVE_REFS` refs (a bigger request
 * can't be a real cart, so it's abuse). No auth — product data is public. Returns the final
 * `ResolvedCartProduct` shape (display name already `name · label`); the client uses rows directly.
 *
 * Subscription discipline (§5): the cart sidebar subscribes with its line refs only while open;
 * the checkout page subscribes with cart refs + active claim ref. Live price edits push into open
 * carts/checkouts automatically. The checkout server reprices at placement regardless.
 */

// LIBRARIES
import { ConvexError, v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// CONFIG
import { CART_CONFIG } from '@/shared/config';

// HELPERS
import { resolveRefs } from '../helpers/resolveRefs';

// VALIDATORS
import { resolvedCartProductRow } from '../validators/cartValidators';

export const resolveCartProducts = query({
	args: { refs: v.array(v.string()) },
	returns: v.array(resolvedCartProductRow),
	handler: async (ctx, args) => {
		if (args.refs.length > CART_CONFIG.MAX_RESOLVE_REFS) {
			throw new ConvexError({
				code: 'TOO_MANY_REFS',
				message: { key: 'ProductMessages.TOO_MANY_REFS' }
			});
		}
		return await resolveRefs(ctx, args.refs);
	}
});
