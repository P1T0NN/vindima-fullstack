// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { createDeleteMutation } from '../../helpers/createDeleteMutation.js';
import { fetchOptimized } from '../../helpers/fetchOptimized/index.js';

// R2
import { r2 } from './r2.js';

// TYPES
import type { MutationCtx } from '../../_generated/server';
import type { Doc } from '../../_generated/dataModel';

/** Change this one line when copying this file into a new project. */
const TABLE = 'uploadedFilesR2' as const;

/**
 * Phase 1 storage cleanup for `uploadedFilesR2`. Dedupes R2 keys (rows can share an object)
 * then deletes each in parallel via the R2 client. Wire this into any
 * {@link createDeleteMutation} for tables whose rows reference R2.
 */
export const deleteFilesFromR2 = async (ctx: MutationCtx, docs: Doc<typeof TABLE>[]) => {
	const keys = [...new Set(docs.map((d) => d.key))];
	await Promise.all(keys.map((k) => r2.deleteObject(ctx, k)));
};

/**
 * Mirror of `fetchUploadedFiles` — sortable by Created via the implicit creation-time index.
 */
export const fetchUploadedFilesR2 = fetchOptimized({
	table: TABLE,
	args: {
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	order: (args) => args.sortDirection ?? 'desc'
});

/**
 * Owner-only bulk delete for `uploadedFilesR2`. Same factory as the Convex-storage path,
 * with the R2 cleanup callback wired through the universal `runStorageDelete` hook.
 */
export const deleteUploadedFileR2 = createDeleteMutation('deleteUploadedFileR2', {
	table: TABLE,
	ownerId: { field: (doc) => doc.ownerId },
	runStorageDelete: deleteFilesFromR2
});
