import { v } from 'convex/values';
import { internalQuery, type DatabaseReader } from '@/convex/_generated/server';

type AvailabilityContext = { db: DatabaseReader };

export async function isPickupSlotBlocked(
	ctx: AvailabilityContext,
	date: string,
	time: string
): Promise<boolean> {
	const availability = await ctx.db
		.query('availability')
		.withIndex('by_date', (query) => query.eq('date', date))
		.unique();

	return availability?.blockedTimes.includes(time) ?? false;
}

/** Actions have no database reader, so payment creation calls this internal point query. */
export const checkPickupSlotBlocked = internalQuery({
	args: { date: v.string(), time: v.string() },
	returns: v.boolean(),
	handler: async (ctx, args) => isPickupSlotBlocked(ctx, args.date, args.time)
});
