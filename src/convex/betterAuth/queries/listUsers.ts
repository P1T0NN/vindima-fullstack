import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';
import { api } from '../_generated/api.js';
import { query } from '../_generated/server.js';
import type { Doc } from '../_generated/dataModel.js';
import { buildUserWhere } from '../utils/userFilters.js';

const user = v.object({
	id: v.string(),
	name: v.string(),
	email: v.string(),
	emailVerified: v.boolean(),
	image: v.union(v.null(), v.string()),
	role: v.string(),
	banned: v.boolean(),
	createdAt: v.number()
});

export const listUsers = query({
	args: {
		paginationOpts: paginationOptsValidator,
		search: v.optional(v.string()),
		filters: v.optional(v.record(v.string(), v.string()))
	},
	returns: v.object({
		items: v.array(user),
		nextCursor: v.union(v.null(), v.string()),
		hasNextPage: v.boolean(),
		pageSize: v.number()
	}),
	handler: async (ctx, args) => {
		const where = buildUserWhere(args.search, args.filters);

		const result = (await ctx.runQuery(api.adapter.findMany, {
			model: 'user',
			sortBy: { field: 'createdAt', direction: 'desc' },
			where: where.length ? where : undefined,
			paginationOpts: args.paginationOpts
		})) as { page: Doc<'user'>[]; isDone: boolean; continueCursor: string };

		return {
			items: result.page.map((row) => ({
				id: String(row._id),
				name: row.name,
				email: row.email,
				emailVerified: row.emailVerified,
				image: row.image ?? null,
				role: row.role ?? 'user',
				banned: row.banned ?? false,
				createdAt: row.createdAt
			})),
			nextCursor: result.isDone ? null : result.continueCursor,
			hasNextPage: !result.isDone,
			pageSize: args.paginationOpts.numItems
		};
	}
});
