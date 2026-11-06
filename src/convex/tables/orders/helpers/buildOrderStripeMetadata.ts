// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** Stripe metadata limits: 50 keys, key ≤ 40 chars, value ≤ 500 chars. */
export const STRIPE_METADATA_MAX_VALUE_LENGTH = 500;

type OrderForMetadata = Pick<
	Doc<'orders'>,
	'_id' | 'number' | 'name' | 'phone' | 'note' | 'delivery'
>;

function clip(value: string | undefined): string | undefined {
	const trimmed = value?.trim();
	if (!trimmed) return undefined;
	return trimmed.length > STRIPE_METADATA_MAX_VALUE_LENGTH
		? trimmed.slice(0, STRIPE_METADATA_MAX_VALUE_LENGTH)
		: trimmed;
}

/**
 * Metadata attached to the Checkout Session AND its PaymentIntent (`StripeSystemDesign.md` §7.2),
 * so the store's own Stripe tools can read pickup and contact details of a paid order.
 *
 * `orderId` / `orderNumber` are unchanged — the webhook settles on `metadata.orderId`. The other
 * keys are optional and omitted when empty; every value is trimmed and cut to Stripe's 500-char
 * limit so a long note can never make session creation fail. Name and phone are personal data:
 * they become visible to anyone with access to the Stripe account.
 */
export function buildOrderStripeMetadata(order: OrderForMetadata): Record<string, string> {
	const metadata: Record<string, string> = { orderId: order._id, orderNumber: order.number };
	const optional: Record<string, string | undefined> = {
		pickupDate: order.delivery.kind === 'pickup' ? order.delivery.pickupDate : undefined,
		pickupTime: order.delivery.kind === 'pickup' ? order.delivery.pickupTime : undefined,
		customerName: order.name,
		customerPhone: order.phone,
		customerNote: order.note
	};
	for (const [key, value] of Object.entries(optional)) {
		const clipped = clip(value);
		if (clipped !== undefined) metadata[key] = clipped;
	}
	return metadata;
}
