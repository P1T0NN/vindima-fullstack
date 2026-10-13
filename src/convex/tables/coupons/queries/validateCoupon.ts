import { ConvexError, v } from 'convex/values';
import { query } from '../../../_generated/server.js';
import { getAuthUserId } from '../../../betterAuth/helpers/getAuthUserId.js';
import { getCouponForCheckout } from '../helpers/getCouponForCheckout.js';
import { couponValidationResult } from '../validators/couponValidators.js';
import { couponCodeSchema } from '../../../../shared/features/coupons/schemas/couponSchemas.js';

/** Preview only; placement rechecks eligibility against server-priced merchandise. */
export const validateCoupon = query({
	args: {
		code: v.string(),
		subtotalMinor: v.number(),
		email: v.string(),
		now: v.number(),
		customerRef: v.optional(v.string())
	},
	returns: couponValidationResult,
	handler: async (ctx, args) => {
		if (
			!couponCodeSchema.safeParse(args.code).success ||
			!Number.isSafeInteger(args.subtotalMinor) ||
			args.subtotalMinor <= 0 ||
			!Number.isFinite(args.now)
		) {
			throw new ConvexError({
				code: 'INVALID_COUPON_DATA',
				message: 'Revisa el código del cupón y tu pedido.'
			});
		}
		const { coupon, discountMinor } = await getCouponForCheckout(ctx, {
			...args,
			discountSubtotalMinor: args.subtotalMinor,
			userId: await getAuthUserId(ctx)
		});
		return { code: coupon.code, percentOff: coupon.percentOff, discountMinor };
	}
});
