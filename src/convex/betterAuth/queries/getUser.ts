import { v } from 'convex/values';
import { api } from '../_generated/api.js';
import { query } from '../_generated/server.js';
import type { Doc } from '../_generated/dataModel.js';

export const getUser = query({
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
	handler: async (ctx, { id }) => {
		const row = (await ctx.runQuery(api.adapter.findOne, {
			model: 'user',
			where: [{ field: '_id', value: id }]
		})) as Doc<'user'> | null;
		if (!row) return null;
		return {
			id: String(row._id),
			name: row.name,
			email: row.email,
			emailVerified: row.emailVerified,
			image: row.image ?? null,
			role: row.role ?? 'user',
			banned: row.banned ?? false,
			createdAt: row.createdAt
		};
	}
});
