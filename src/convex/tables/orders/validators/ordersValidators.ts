// LIBRARIES
import { v } from 'convex/values';

/** A snapshotted order line — name + unit price frozen at placement. */
export const orderLineValidator = v.object({
	/** Opaque product reference, resolved by the app layer (same discipline as the cart). */
	productRef: v.string(),
	/** Display name frozen at placement so order history doesn't change with the catalog. */
	name: v.string(),
	qty: v.number(),
	/** Unit price frozen at placement, minor units. 0 = the claimed free-reward line. */
	unitPriceMinor: v.number(),
	/** Marks a free line from a reward claim (display + excluded from the stamp subtotal). */
	isRewardLine: v.optional(v.boolean())
});

/** The full price breakdown, all integer minor units. total = subtotal - discount + shipping. */
export const orderAmountsValidator = v.object({
	/** Sum of non-reward lines (unit × qty). */
	subtotalMinor: v.number(),
	/** First-purchase discount applied, 0 when none. */
	welcomeDiscountMinor: v.number(),
	/** Shipping fee, 0 for pickup / free-above threshold. */
	shippingMinor: v.number(),
	/** subtotal - welcomeDiscount + shipping. The one number charged. */
	totalMinor: v.number()
});

/** Where/how the customer receives the order. */
export const orderDeliveryValidator = v.union(
	v.object({ kind: v.literal('pickup') }),
	v.object({
		kind: v.literal('delivery'),
		address: v.object({
			line1: v.string(),
			line2: v.optional(v.string()),
			city: v.string(),
			postcode: v.string(),
			country: v.string()
		})
	})
);

