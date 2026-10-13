import { ConvexError, v } from 'convex/values';
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';
import { saveCouponSchema } from '../../../../shared/features/coupons/schemas/couponSchemas.js';
import { couponFields } from '../schemas/couponsSchema.js';

export const saveCoupon = adminMutation({
	rateLimit: { name: 'coupons:save' },
	args: couponFields,
	returns: v.id('coupons'),
	handler: async (ctx, args) => {
		const parsed = saveCouponSchema.safeParse(args);
		if (!parsed.success)
			throw new ConvexError({
				code: 'INVALID_COUPON_DATA',
				message: 'Revisa los datos del cupón.'
			});
		const data = parsed.data;
		const existing = await ctx.db
			.query('coupons')
			.withIndex('by_code', (q) => q.eq('code', data.code))
			.unique();
		if (existing)
			throw new ConvexError({
				code: 'COUPON_CODE_TAKEN',
				message: 'Ya existe un cupón con ese código.'
			});
		return ctx.db.insert('coupons', { ...data, redemptionCount: 0 });
	}
});
