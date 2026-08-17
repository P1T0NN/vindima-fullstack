// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// VALIDATORS
import {
	orderLineValidator,
	orderAmountsValidator,
	orderDeliveryValidator,
	orderPaymentMethodValidator
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

	/** Money truth. `pending` = awaiting payment; terminal states never regress.
	 *
	 *  `draft` is NOT an order yet — it is the pre-payment state of an `online` order, and it
	 *  exists only because `placeOrder` is a mutation (it cannot call Stripe) and a Checkout
	 *  Session cannot carry the lines, contact, delivery and reward claim the settlement needs.
	 *  A draft is excluded from every customer, admin, counter, search and email surface, and is
	 *  hard-deleted by the cron if abandoned — so "the order is created when Stripe confirms it"
	 *  holds observably. The webhook turns it into a real order by flipping it straight to
	 *  `paid`; it never passes through `pending`. Cash orders are never drafts. */
	status: v.union(
		v.literal('draft'),
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
	/** Shopper's chosen payment method (spec §8.1). Optional so pre-existing rows validate;
	 *  a missing value means the historical default, `cash` (the old manual-only behaviour). */
	paymentMethod: v.optional(orderPaymentMethodValidator),
	/** Optional customer note ("no onions", "call on arrival"). Display only. */
	note: v.optional(v.string()),

	/** Reward claim consumed by this order, if any (applied on settle, released on cancel). */
	claimId: v.optional(v.id('rewardClaims')),
	/** Provider's payment reference — the Stripe PaymentIntent id, set at settlement. Absent
	 *  for the 'manual' provider. A historical fact, never re-read as a live reference. */
	paymentRef: v.optional(v.string()),

	/** Epoch-ms the order was settled (`markOrderPaid`) — the single money-path timestamp the
	 *  dashboard sums over. Set on the `pending|draft → paid` transition; refunded orders keep
	 *  it. Optional so pre-existing rows validate; history starts when this field shipped. */
	settledAt: v.optional(v.number()),
	/** Epoch-ms the order was refunded (`markOrderRefunded`). Set on `paid → refunded`. */
	refundedAt: v.optional(v.number()),

	/** Stripe Checkout Session currently attached to this order (`StripeSystemDesign.md` §6).
	 *  Cleared — and the session expired — whenever the draft changes or is cancelled; the
	 *  webhook only settles a payment whose session matches this value (§8.2). Retained on
	 *  settled orders as audit history. Meaningless for cash orders. */
	paymentSessionRef: v.optional(v.string()),
	/** Monotonic counter, bumped every time a payment session is invalidated. It seeds the
	 *  Stripe idempotency key (`sess:{orderId}:{attempt}`), which is what makes two racing
	 *  session creations collapse to ONE session while still minting a genuinely new session
	 *  after an edit — a key that never rotated would replay the stale (expired, wrongly
	 *  priced) session for 24h. See `StripeSystemDesign.md` §7.3.2. */
	paymentSessionAttempt: v.optional(v.number()),

	/** Denormalized "number + name + email" blob, written at placement (see
	 *  `buildOrderSearchText`). Powers the admin table's full-text search only — never
	 *  display data. Optional so old rows validate; every new order sets it. */
	searchText: v.optional(v.string())
})
	.index('by_user', ['userId'])
	// Customer order tabs: one user's orders narrowed to a status, newest first.
	.index('by_user_and_status', ['userId', 'status'])
	.index('by_attempt', ['attemptId'])
	.index('by_status', ['status'])
	// Guest order lookup: the shopper types the number printed on their receipt. Exact-match
	// only — the email must still match too, so this index is a finder, not an authenticator.
	.index('by_number', ['number'])
	// Dashboard money windows: settled/refunded orders by their lifecycle timestamps.
	.index('by_settledAt', ['settledAt'])
	.index('by_refundedAt', ['refundedAt'])
	// Admin order search: match number/customer, still filterable by status.
	.searchIndex('search_text', { searchField: 'searchText', filterFields: ['status'] });
