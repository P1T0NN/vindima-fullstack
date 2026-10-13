/**
 * Percent-off discount codes redeemed at checkout. Flipping the flag to false
 * hides the admin section and the checkout coupon field; existing orders keep
 * their stored discount snapshot. With COUPONS_REQUIRE_SIGN_IN on, guests see
 * a sign-in notice instead of the code field and the backend rejects guest
 * coupon use.
 */
export const COUPONS_CONFIG = {
	HAS_COUPONS: true,
	COUPONS_REQUIRE_SIGN_IN: false,
	minCodeLength: 3,
	maxCodeLength: 32,
	maxNameLength: 100,
	/** 100% is rejected: a zero-total Stripe Checkout session is not paid flow. */
	minPercentOff: 1,
	maxPercentOff: 99,
	maxRedemptions: 100_000,
	maxMinSubtotalMinor: 10_000_000
} as const;
