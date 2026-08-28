import { defineTable } from 'convex/server';
import { v } from 'convex/values';

/** One bounded exception row per pickup date. Absence means every configured slot is open. */
export const availabilityTable = defineTable({
	date: v.string(),
	blockedTimes: v.array(v.string())
}).index('by_date', ['date']);
