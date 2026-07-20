// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Paginated list for the admin audit-log viewer. Admin-only — audit data is sensitive by
 * definition. Newest entries first (sortable by `_creationTime` only; `sortColumn` is
 * forwarded by the DataTable but ignored since no other column is sort-eligible).
 *
 * Filters are mutually exclusive — pick at most one of `userId` / `action` / `resource`.
 * Convex doesn't compose multiple `withIndex` filters in one read, and combining them
 * in-memory after pagination would break ordering. No filter = full-table walk along
 * `_creationTime`, same as before.
 */
export const fetchAuditLogs = fetchOptimized({
	table: 'auditLogs',
	auth: 'admin',
	args: {
		userId: v.optional(v.string()),
		action: v.optional(v.string()),
		resource: v.optional(v.object({ table: v.string(), id: v.string() })),
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	order: (args) => args.sortDirection ?? 'desc',
	where: (_ctx, args) => {
		if (args.userId) return { index: 'by_user', eq: { userId: args.userId } };
		if (args.action) return { index: 'by_action', eq: { action: args.action } };
		if (args.resource) {
			return {
				index: 'by_resource',
				// Nested index fields are dotted paths — outside what Partial<Doc> can express.
				eq: {
					'resource.table': args.resource.table,
					'resource.id': args.resource.id
				} as Partial<Doc<'auditLogs'>>
			};
		}
		return null;
	}
});
