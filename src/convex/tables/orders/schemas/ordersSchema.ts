// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// VALIDATORS
import {
	orderLineValidator,
	orderAmountsValidator,
	orderDeliveryValidator
} from '../validators/ordersValidators';

/**
 * Orders table — one document per order. See `CheckoutPageSystemDesign.md` §4.
 *
 * Unlike the cart (which never stores prices), an order is a **contract**: line names and
 * unit prices are SNAPSHOTTED at placement so order history is immune to later catalog or
 * price changes. All money is integer minor units — no floats anywhere.
 *
 * Two-phase lifecycle: placement (`status: 'pending'`, reversible, holds the price snapshot)
 * and settlement (`markOrderPaid` → `status: 'paid'`, where every reward/side-effect fires
 * exactly once). Terminal states (`cancelled`/`refunded`) never regress.
 *
 * Portable: copy the `tables/orders` folder, add `orders` to the root schema, register
 * `placeOrder`/`cancelMyOrder` in the rate-limit registry, wire the cron. Lines store an
 * opaque `productRef` (+ snapshot) only — this module never assumes a product schema.
 */
export const ordersTable = defineTable({
	/** better-auth id, or null for guest checkout. */
	userId: v.union(v.string(), v.null()),

	/** Contact — always present (guests type it; auth users get it prefilled). */
	email: v.string(),
	name: v.string(),
	phone: v.optional(v.string()),

	/** Human-facing short reference, e.g. "ORD-MK3F9Z". Display only; `_id` is the key. */
	number: v.string(),

	/** Client-generated idempotency key. The same attempt replayed → the same order. */
	attemptId: v.string(),

	/** Money truth. `pending` = awaiting payment; terminal states never regress. */
	status: v.union(
		v.literal('pending'),
		v.literal('paid'),
		v.literal('cancelled'),
		v.literal('refunded')
	),
	/** Admin-set progress AFTER payment; null until then. Drives the account UI badge. */
	fulfillment: v.union(
		v.null(),
		v.literal('processing'),
		v.literal('shipped'),
		v.literal('delivered')
	),

	lines: v.array(orderLineValidator),
	amounts: orderAmountsValidator,
	/** ISO 4217, snapshotted from CART_CONFIG.CURRENCY so a currency switch can't rewrite history. */
	currency: v.string(),

	delivery: orderDeliveryValidator,
	/** Optional customer note ("no onions", "call on arrival"). Display only. */
	note: v.optional(v.string()),

	/** Reward claim consumed by this order, if any (applied on settle, released on cancel). */
	claimId: v.optional(v.id('rewardClaims')),
	/** Provider's payment reference (intent/session id). Absent for the 'manual' provider. */
	paymentRef: v.optional(v.string()),

	/** Denormalized "number + name + email" blob, written at placement (see
	 *  `buildOrderSearchText`). Powers the admin table's full-text search only — never
	 *  display data. Optional so old rows validate; every new order sets it. */
	searchText: v.optional(v.string())
})
	.index('by_user', ['userId'])
	.index('by_attempt', ['attemptId'])
	.index('by_status', ['status'])
	// Admin order search: match number/customer, still filterable by status.
	.searchIndex('search_text', { searchField: 'searchText', filterFields: ['status'] });
