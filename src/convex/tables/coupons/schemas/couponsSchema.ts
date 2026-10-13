import { defineTable } from 'convex/server';
import { v } from 'convex/values';

export const couponFields = {
	name: v.string(),
	code: v.string(),
	percentOff: v.number(),
	active: v.boolean(),
	expiresAt: v.optional(v.number()),
	minSubtotalMinor: v.optional(v.number()),
	maxRedemptions: v.optional(v.number()),
	onePerCustomer: v.boolean()
};

export const couponsTable = defineTable({
	...couponFields,
	redemptionCount: v.number()
}).index('by_code', ['code']);
