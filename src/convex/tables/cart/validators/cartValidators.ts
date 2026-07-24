/**
 * Shared Convex validators for cart-facing shapes.
 */

// LIBRARIES
import { v } from 'convex/values';

/** Batch resolver output — raw fields + price (cart/checkout); the client composes display. */
export const resolvedCartProductRow = v.object({
	productRef: v.string(),
	productName: v.union(v.string(), v.null()),
	variantLabel: v.union(v.string(), v.null()),
	imageUrl: v.union(v.string(), v.null()),
	unitPriceMinor: v.union(v.number(), v.null()),
	currency: v.string()
});
