// LIBRARIES
import { internalMutation } from '../../_generated/server';

// R2
import { r2 } from '../r2/r2';

/**
 * Bidirectional cleanup between the R2 bucket and the `uploadedFilesR2` table.
 * Catches the manual-delete cases the upload pipeline can't:
 *
 *   - Row deleted from the Convex dashboard → orphaned R2 object → we delete the object.
 *   - R2 object deleted from the Cloudflare dashboard → row points at nothing → we delete
 *     the row.
 *
 * Safe to run bidirectionally because the R2 bucket is dedicated to this table — no
 * other feature stores keys here. If that ever changes, narrow the object→row direction.
 *
 * Sizing: one page of R2 metadata is `PAGE_SIZE` keys; we walk up to `MAX_PAGES`. For a
 * datasets larger than `PAGE_SIZE * MAX_PAGES` orphans accumulate beyond the sweep
 * window — bump the constants or split into a paginated-by-cron design.
 */
const PAGE_SIZE = 200;
const MAX_PAGES = 25;

export const cleanupOrphanDataR2 = internalMutation({
	args: {},
	handler: async (ctx) => {
		// 1. Snapshot R2 keys (paginate through the component's metadata table).
		const r2Keys = new Set<string>();
		let cursor: string | null = null;
		for (let i = 0; i < MAX_PAGES; i++) {
			const page = await r2.listMetadata(ctx, PAGE_SIZE, cursor);
			for (const m of page.page) r2Keys.add(m.key);
			if (page.isDone) break;
			cursor = page.continueCursor;
		}

		// 2. Walk rows. Delete any whose key has no R2 object behind it.
		const rows = await ctx.db.query('uploadedFilesR2').collect();
		const rowKeys = new Set<string>();
		let staleRows = 0;
		for (const row of rows) {
			rowKeys.add(row.key);
			if (!r2Keys.has(row.key)) {
				await ctx.db.delete(row._id);
				staleRows++;
			}
		}

		// 3. Delete R2 objects with no row referencing them.
		let staleObjects = 0;
		for (const k of r2Keys) {
			if (!rowKeys.has(k)) {
				await r2.deleteObject(ctx, k);
				staleObjects++;
			}
		}

		if (staleRows || staleObjects) {
			console.warn('[cleanupOrphanDataR2] cleaned orphans', {
				staleRows,
				staleObjects,
				scannedRows: rows.length,
				scannedObjects: r2Keys.size
			});
		}

		return {
			staleRows,
			staleObjects,
			scannedRows: rows.length,
			scannedObjects: r2Keys.size
		};
	}
});
