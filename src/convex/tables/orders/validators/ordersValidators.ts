// LIBRARIES
import { v } from 'convex/values';

// VALIDATORS
import { resolvedCartProductRow } from '@/convex/tables/cart/validators/cartValidators';

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

/** How the shopper chose to pay (spec §8.1). `cash` = offline/manual; `online` = hosted page (Stripe). */
export const orderPaymentMethodValidator = v.union(v.literal('cash'), v.literal('online'));

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

/** Complete order document returned by admin and customer order listings. */
export const orderRowValidator = v.object({
	_id: v.id('orders'),
	_creationTime: v.number(),
	userId: v.union(v.string(), v.null()),
	email: v.string(),
	name: v.string(),
	phone: v.optional(v.string()),
	number: v.string(),
	attemptId: v.string(),
	status: v.union(
		v.literal('draft'),
		v.literal('pending'),
		v.literal('paid'),
		v.literal('cancelled'),
		v.literal('refunded')
	),
	fulfillment: v.union(
		v.null(),
		v.literal('processing'),
		v.literal('shipped'),
		v.literal('delivered')
	),
	lines: v.array(orderLineValidator),
	amounts: orderAmountsValidator,
	currency: v.string(),
	delivery: orderDeliveryValidator,
	paymentMethod: v.optional(orderPaymentMethodValidator),
	note: v.optional(v.string()),
	claimId: v.optional(v.id('rewardClaims')),
	paymentRef: v.optional(v.string()),
	settledAt: v.optional(v.number()),
	refundedAt: v.optional(v.number()),
	paymentSessionRef: v.optional(v.string()),
	paymentSessionAttempt: v.optional(v.number()),
	searchText: v.optional(v.string())
});

/** Customer order row with bounded live catalog projections for its lines. */
export const myOrderRowValidator = orderRowValidator.extend({
	products: v.array(resolvedCartProductRow)
});
