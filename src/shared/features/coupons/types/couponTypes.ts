/** Coupon state the checkout keeps after a successful server validation. */
export type AppliedCoupon = {
	code: string;
	percentOff: number;
};
