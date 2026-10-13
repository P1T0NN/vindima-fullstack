import { v } from 'convex/values';
import { couponFields } from '../schemas/couponsSchema.js';
import { paginatedPageValidator } from '../../../helpers/getPagination.js';

export const couponResult = v.object({
	_id: v.id('coupons'),
	_creationTime: v.number(),
	...couponFields,
	redemptionCount: v.number()
});
export const couponPage = paginatedPageValidator(couponResult);
export const couponValidationResult = v.object({
	code: v.string(),
	percentOff: v.number(),
	discountMinor: v.number()
});
