import { v } from 'convex/values';
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';
import { mutationResult } from '@/convex/validators/mutationResult';
import { getPickupTimeSlots } from '@/shared/features/checkout/config.js';
import { isPickupDate } from '@/shared/features/checkout/utils/isPickupDate.js';
import type { ConvexMutationResult } from '@/shared/types/types';

export const setAvailability = adminMutation({
	args: { date: v.string(), blockedTimes: v.array(v.string()) },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const requested = new Set(args.blockedTimes);
		const blockedTimes = getPickupTimeSlots(args.date).filter((time) => requested.has(time));
		if (
			!isPickupDate(args.date) ||
			requested.size !== args.blockedTimes.length ||
			blockedTimes.length !== requested.size
		) {
			return { success: false, message: 'La fecha o los horarios no son válidos.' };
		}

		const existing = await ctx.db
			.query('availability')
			.withIndex('by_date', (query) => query.eq('date', args.date))
			.unique();

		if (blockedTimes.length === 0) {
			if (existing) await ctx.db.delete(existing._id);
		} else if (existing) {
			await ctx.db.patch(existing._id, { blockedTimes });
		} else {
			await ctx.db.insert('availability', { date: args.date, blockedTimes });
		}

		return { success: true, message: 'Disponibilidad actualizada.' };
	}
});
