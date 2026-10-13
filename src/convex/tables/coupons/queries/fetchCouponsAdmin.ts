import { paginationOptsValidator } from 'convex/server';
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';
import { getPagination } from '../../../helpers/getPagination.js';
import { couponPage } from '../validators/couponValidators.js';

export const fetchCouponsAdmin = adminQuery({
	args: { paginationOpts: paginationOptsValidator },
	returns: couponPage,
	handler: (ctx, args) =>
		getPagination(ctx.db.query('coupons').order('desc'), { paginationOpts: args.paginationOpts })
});
