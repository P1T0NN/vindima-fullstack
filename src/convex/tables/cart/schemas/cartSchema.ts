// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/**
 * Cart table — one document per authenticated user, the whole cart embedded as an
 * array. One index lookup per read/subscription, atomic mutations over the full
 * cart, atomic merge on login. See `CartSystem.md` §4.
 *
 * Portable: copy the `tables/cart` folder into a new project, add `carts` to the
 * root schema, register the four mutation names in the rate-limit registry. Lines
 * store an opaque `productRef` only — this module never assumes a product schema.
 */

/** Shared line validator — reused by the merge mutation's args and the query return. */
export const cartLineValidator = v.object({
	productRef: v.string(),
	qty: v.number(),
	addedAt: v.number()
});

export const cartsTable = defineTable({
	userId: v.string(),
	lines: v.array(cartLineValidator),
	updatedAt: v.number()
}).index('by_user', ['userId']);
