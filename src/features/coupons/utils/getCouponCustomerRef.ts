/** Stable guest identity, independent of checkout attempts that are cleared after payment. */
export function getCouponCustomerRef(): string | undefined {
	try {
		if (typeof localStorage === 'undefined') return undefined;
		const key = 'coupons.customer.v1';
		const saved = localStorage.getItem(key);
		if (saved) return saved;
		const id = crypto.randomUUID();
		localStorage.setItem(key, id);
		return id;
	} catch {
		// Blocked storage still permits checkout; the server also checks the checkout email.
		return undefined;
	}
}
