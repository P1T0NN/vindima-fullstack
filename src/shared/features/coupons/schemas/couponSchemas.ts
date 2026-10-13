import { z } from 'zod';
import { COUPONS_CONFIG } from '../config.js';
import { CART_CONFIG } from '../../cart/config.js';
import { normalizeCouponCode } from '../utils/normalizeCouponCode.js';
import { toMinorUnits } from '@/utils/formatters.js';

export const couponCodeSchema = z
	.string()
	.trim()
	.min(COUPONS_CONFIG.minCodeLength)
	.max(COUPONS_CONFIG.maxCodeLength)
	.transform(normalizeCouponCode);

export const saveCouponSchema = z.object({
	name: z.string().trim().min(1).max(COUPONS_CONFIG.maxNameLength),
	code: couponCodeSchema,
	percentOff: z.number().int().min(COUPONS_CONFIG.minPercentOff).max(COUPONS_CONFIG.maxPercentOff),
	active: z.boolean(),
	onePerCustomer: z.boolean(),
	expiresAt: z.number().int().positive().optional(),
	minSubtotalMinor: z.number().int().min(1).max(COUPONS_CONFIG.maxMinSubtotalMinor).optional(),
	maxRedemptions: z.number().int().min(1).max(COUPONS_CONFIG.maxRedemptions).optional()
});

const emptyToUndefined = z.literal('').transform(() => undefined);

/** The admin enters money in the cart currency and an expiry date inclusive of its UTC day. */
export const saveCouponFormSchema = saveCouponSchema.extend({
	percentOff: z.coerce.number().pipe(saveCouponSchema.shape.percentOff),
	minSubtotalMinor: z
		.union([
			emptyToUndefined,
			z
				.string()
				.trim()
				.min(1)
				.transform((value) => toMinorUnits(Number(value), CART_CONFIG.CURRENCY))
				.pipe(saveCouponSchema.shape.minSubtotalMinor.unwrap())
		])
		.optional(),
	maxRedemptions: z
		.union([
			emptyToUndefined,
			z.coerce.number().pipe(saveCouponSchema.shape.maxRedemptions.unwrap())
		])
		.optional(),
	expiresAt: z
		.union([
			emptyToUndefined,
			z.iso.date().transform((value) => Date.parse(`${value}T23:59:59.999Z`))
		])
		.optional()
});
