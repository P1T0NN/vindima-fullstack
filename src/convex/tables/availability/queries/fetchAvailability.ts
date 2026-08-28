import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';
import { adminQuery } from '@/convex/builders/convexFunctionBuilders';

const availabilityValidator = v.object({
	date: v.string(),
	blockedTimes: v.array(v.string())
});

export const fetchBlockedPickupTimes = query({
	args: { date: v.string() },
	returns: availabilityValidator,
	handler: async (ctx, args) => {
		const availability = await ctx.db
			.query('availability')
			.withIndex('by_date', (query) => query.eq('date', args.date))
			.unique();

		return { date: args.date, blockedTimes: availability?.blockedTimes ?? [] };
	}
});

export const fetchAvailability = adminQuery({
	args: { from: v.string(), to: v.string() },
	returns: v.object({
		from: v.string(),
		to: v.string(),
		dates: v.array(availabilityValidator)
	}),
	handler: async (ctx, args) => {
		if (args.from > args.to) return { from: args.from, to: args.to, dates: [] };

		const rows = await ctx.db
			.query('availability')
			.withIndex('by_date', (query) => query.gte('date', args.from).lte('date', args.to))
			.take(31);
		const dates = rows.map(({ date, blockedTimes }) => ({ date, blockedTimes }));

		return { from: args.from, to: args.to, dates };
	}
});
