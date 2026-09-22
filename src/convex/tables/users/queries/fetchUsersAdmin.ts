import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { components } from '../../../_generated/api.js';
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

export const fetchUsersAdmin = adminQuery({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		filters: v.optional(v.record(v.string(), v.string()))
	},
	returns: v.object({
		items: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				email: v.string(),
				emailVerified: v.boolean(),
				image: v.union(v.null(), v.string()),
				role: v.string(),
				banned: v.boolean(),
				createdAt: v.number()
			})
		),
		nextCursor: v.union(v.null(), v.string()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, args) =>
		ctx.runQuery(components.betterAuth.queries.listUsers.listUsers, args)
});
