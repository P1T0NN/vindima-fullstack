/**
 * Order-number parsing, shared by the tracking form (client) and its lookup query (Convex).
 *
 * Numbers are minted as `ORD-` + the last 6 alphanumerics of the document id, uppercased
 * (`placeOrder`). A shopper retyping one off a receipt or an email will paste it with the
 * prefix, without it, in lowercase, or with stray spaces — all of which should find the order.
 * Anything that can't be a real number normalizes to `''` so the caller can reject it without
 * touching the database.
 */

/** Characters an order number can contain after the prefix. */
const BODY = /^[A-Z0-9]{6}$/;

export function normalizeOrderNumber(input: string): string {
	const cleaned = input
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
		.replace(/^ORD/, '');

	return BODY.test(cleaned) ? `ORD-${cleaned}` : '';
}
