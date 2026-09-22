import { v } from 'convex/values';
import { components } from '../../../_generated/api.js';
import { adminQuery } from '../../../builders/convexFunctionBuilders.js';

export const fetchUserAdmin = adminQuery({
	args: { id: v.string() },
	returns: v.union(
		v.null(),
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
	handler: async (ctx, args) => ctx.runQuery(components.betterAuth.queries.getUser.getUser, args)
});
