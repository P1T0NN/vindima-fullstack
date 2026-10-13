import { ConvexError, v } from 'convex/values';
import { adminMutation } from '../../../builders/convexFunctionBuilders.js';

export const deleteCoupon = adminMutation({
	rateLimit: { name: 'coupons:delete' },
	args: { couponId: v.id('coupons') },
	returns: v.null(),
	handler: async (ctx, args) => {
		const coupon = await ctx.db.get(args.couponId);
		if (!coupon)
			throw new ConvexError({ code: 'COUPON_NOT_FOUND', message: 'No encontramos ese cupón.' });
		await ctx.db.delete(coupon._id);
		return null;
	}
});
