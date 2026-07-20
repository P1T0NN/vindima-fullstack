// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { createDeleteMutation } from '../../helpers/createDeleteMutation.js';
import { fetchOptimized } from '../../helpers/fetchOptimized/index.js';

// TYPES
import type { MutationCtx } from '../../_generated/server';
import type { Doc } from '../../_generated/dataModel';

/** Change this one line when copying this file into a new project. */
const TABLE = 'uploadedFiles' as const;

/**
 * Phase 1 storage cleanup for `uploadedFiles`. Dedupes blob ids (rows can share a thumbnail/
 * avatar/template image) so a shared blob isn't double-deleted into a spurious NOT_FOUND,
 * then issues parallel `ctx.storage.delete` calls. Wire this into any
 * {@link createDeleteMutation} for tables whose rows reference Convex `_storage`.
 */
export const deleteFilesFromConvexStorage = async (ctx: MutationCtx, docs: Doc<typeof TABLE>[]) => {
	const blobs = [...new Set(docs.map((d) => d.storageId))];
	await Promise.all(blobs.map((sid) => ctx.storage.delete(sid)));
};

/**
 * Sortable by Created (only). Other columns aren't useful sort keys for this table.
 *
 * `sortColumn` is forwarded by the data-table for any sortable column click — we only act
 * on `'created'` here. `sortDirection` toggles asc/desc through the implicit
 * `by_creation_time` index (no schema change needed for that direction).
 */
export const fetchUploadedFiles = fetchOptimized({
	table: TABLE,
	args: {
		sortColumn: v.optional(v.string()),
		sortDirection: v.optional(v.union(v.literal('asc'), v.literal('desc')))
	},
	order: (args) => args.sortDirection ?? 'desc'
});

/**
 * Hybrid bulk delete for `uploadedFiles`. All heavy lifting (batch cap, weighted rate limit,
 * 2-phase atomicity, storage cleanup, translatable results + errors) lives
 * in {@link createDeleteMutation}.
 *
 * Authorization: owner-only. Supplying `ownerId` makes the factory skip the default
 * `adminOnly` gate — an authed owner can remove their own files; admins can't (yet) touch
 * other users' files via this endpoint. If a cross-user admin delete is ever needed, build
 * it as a separate mutation with `adminOnly: true` (never widen this one).
 */
export const deleteUploadedFile = createDeleteMutation('deleteUploadedFile', {
	table: TABLE,
	ownerId: { field: (doc) => doc.ownerId },
	runStorageDelete: deleteFilesFromConvexStorage
});
