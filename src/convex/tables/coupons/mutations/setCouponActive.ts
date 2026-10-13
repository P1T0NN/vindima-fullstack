import { ConvexError, v } from 'convex/values';
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

export const setCouponActive = adminMutation({
	rateLimit: { name: 'coupons:status' },
	args: { couponId: v.id('coupons'), active: v.boolean() },
	returns: v.null(),
	handler: async (ctx, args) => {
		const coupon = await ctx.db.get(args.couponId);
		if (!coupon)
			throw new ConvexError({ code: 'COUPON_NOT_FOUND', message: 'No encontramos ese cupón.' });
		await ctx.db.patch(coupon._id, { active: args.active });
		return null;
	}
});
