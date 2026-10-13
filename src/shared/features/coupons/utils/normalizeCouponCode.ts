/** Coupon codes are stored and compared trimmed and uppercased. */
export function normalizeCouponCode(code: string): string {
	return code.trim().toUpperCase();
}
