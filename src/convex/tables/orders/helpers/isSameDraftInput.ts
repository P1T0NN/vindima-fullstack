// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { PlaceOrderWireInput } from '@/shared/features/orders/schemas/ordersSchemas';

type Delivery = Doc<'orders'>['delivery'];

/** Optional strings compare by content: absent, empty, and whitespace-only are the same intent. */
function sameText(a: string | undefined, b: string | undefined): boolean {
	return (a ?? '').trim() === (b ?? '').trim();
}

function sameDelivery(a: Delivery, b: Delivery): boolean {
	if (a.kind !== b.kind) return false;
	if (a.kind === 'pickup' || b.kind === 'pickup') return true;
	return (
		a.address.line1 === b.address.line1 &&
		sameText(a.address.line2, b.address.line2) &&
		a.address.city === b.address.city &&
		a.address.postcode === b.address.postcode &&
		a.address.country === b.address.country
	);
}

/**
 * Does this placement request describe the *same* order as the pending draft we already have?
 * The decision behind `placeOrder`'s draft-until-paid rule (`StripeSystemDesign.md` §5.3.5):
 *
 * - `true`  → pure retry (double-click, network retry, back-button resubmit). Return the draft
 *             untouched: no re-pricing, no writes, and the live payment session survives.
 * - `false` → the shopper changed something. Re-price and patch the SAME order in place, which
 *             is what stops a second draft (and a second payable session) from existing.
 *
 * Compared on raw inputs only — cheap, no catalog reads. Reward-claim drift is checked
 * separately by the caller, because it changes the order's lines without changing the request.
 * Reward lines are skipped here for the same reason: they are derived, never submitted.
 */
export function isSameDraftInput(
	order: Doc<'orders'>,
	input: Pick<PlaceOrderWireInput, 'contact' | 'delivery' | 'paymentMethod' | 'note'>,
	clampedLines: { productRef: string; qty: number }[]
): boolean {
	const orderedLines = order.lines.filter((line) => !line.isRewardLine);
	if (orderedLines.length !== clampedLines.length) return false;
	for (let i = 0; i < orderedLines.length; i++) {
		if (orderedLines[i].productRef !== clampedLines[i].productRef) return false;
		if (orderedLines[i].qty !== clampedLines[i].qty) return false;
	}

	// A missing `paymentMethod` on an old row means the historical default, `cash`.
	if ((order.paymentMethod ?? 'cash') !== input.paymentMethod) return false;

	return (
		order.email === input.contact.email &&
		order.name === input.contact.name &&
		sameText(order.phone, input.contact.phone) &&
		sameText(order.note, input.note) &&
		sameDelivery(order.delivery, input.delivery)
	);
}
