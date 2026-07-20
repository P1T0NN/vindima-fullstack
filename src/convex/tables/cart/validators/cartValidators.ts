/**
 * Shared Convex validators for cart-facing shapes.
 */

// LIBRARIES
import { v } from 'convex/values';

/** Batch resolver output — one ref resolved to display + price (cart/checkout). */
export const resolvedCartProductRow = v.object({
	productRef: v.string(),
	name: v.string(),
	imageUrl: v.union(v.string(), v.null()),
	unitPriceMinor: v.union(v.number(), v.null()),
	currency: v.string()
});
