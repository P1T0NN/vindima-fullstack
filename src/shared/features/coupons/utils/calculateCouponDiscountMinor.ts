/**
 * Percent-off discount on the merchandise subtotal, rounded to the nearest
 * minor unit and capped one unit below the subtotal so the payable total (including
 * shipping) can never reach zero. Shared by the checkout preview and the
 * trusted order calculation.
 */
export function calculateCouponDiscountMinor(subtotalMinor: number, percentOff: number): number {
	if (!Number.isSafeInteger(subtotalMinor) || subtotalMinor <= 0) return 0;
	if (!Number.isInteger(percentOff) || percentOff <= 0 || percentOff > 100) return 0;

	const discount = Math.round((subtotalMinor * percentOff) / 100);
	return Math.max(0, Math.min(discount, subtotalMinor - 1));
}
