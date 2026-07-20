// LIBRARIES
import { internalMutation } from '../../_generated/server';

/**
 * Bidirectional cleanup between Convex file storage (`_storage`) and the
 * `uploadedFiles` table. Mirrors {@link cleanupOrphanDataR2} for the Convex-storage backend.
 *
 *   - Row deleted from the dashboard → orphaned blob in `_storage` → we delete the blob.
 *   - Blob deleted from the dashboard → row points at nothing → we delete the row.
 *
 * **IMPORTANT assumption:** `uploadedFiles` is the *only* user table in this project
 * that references `_storage`. The blob → row direction below blindly deletes any
 * `_storage` entry with no matching row — if you add another table that stores
 * `Id<'_storage'>` (avatars, attachments, generated reports, etc.) you MUST update
 * this sweep to union all such tables before deciding which blobs are orphans, or
 * narrow the sweep to one direction only. Otherwise this will silently nuke files
 * other features depend on.
 */
export const cleanupOrphanDataConvexStorage = internalMutation({
	args: {},
	handler: async (ctx) => {
		// 1. Snapshot every blob registered in Convex storage.
		const storageRows = await ctx.db.system.query('_storage').collect();
		const storageIds = new Set(storageRows.map((s) => s._id));

		// 2. Walk rows. Delete any whose storageId no longer exists.
		const rows = await ctx.db.query('uploadedFiles').collect();
		const rowStorageIds = new Set<string>();
		let staleRows = 0;
		for (const row of rows) {
			rowStorageIds.add(row.storageId);
			if (!storageIds.has(row.storageId)) {
				await ctx.db.delete(row._id);
				staleRows++;
			}
		}

		// 3. Delete blobs no row references.
		let staleBlobs = 0;
		for (const sid of storageIds) {
			if (!rowStorageIds.has(sid)) {
				await ctx.storage.delete(sid);
				staleBlobs++;
			}
		}

		if (staleRows || staleBlobs) {
			console.warn('[cleanupOrphanDataConvexStorage] cleaned orphans', {
				staleRows,
				staleBlobs,
				scannedRows: rows.length,
				scannedBlobs: storageIds.size
			});
		}

		return {
			staleRows,
			staleBlobs,
			scannedRows: rows.length,
			scannedBlobs: storageIds.size
		};
	}
});
