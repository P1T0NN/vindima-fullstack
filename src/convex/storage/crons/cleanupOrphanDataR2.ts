// LIBRARIES
import { v } from 'convex/values';

// UTILS
import { internalMutation } from '@/convex/functions';
import { internal } from '../../_generated/api';

// CONFIG
import { STORAGE_CLEANUP_DATA } from '@/shared/config.js';

// R2
import { r2 } from '../r2/r2';

/**
 * Bidirectional cleanup between the R2 bucket and the `uploadedFilesR2` table.
 * Catches the manual-delete cases the upload pipeline can't:
 *
 *   - R2 object deleted from the Cloudflare dashboard → row points at nothing → we delete
 *     the row.
 *   - Row deleted from the Convex dashboard → orphaned R2 object → we delete the object.
 *
 * **Any-scale design:** each direction pages its own side in `STORAGE_CLEANUP_DATA.BATCH`-sized
 * transactions and checks the counterpart PER ITEM with a point lookup (`r2.getMetadata` /
 * the `by_key` index), self-scheduling the next batch until done. No snapshots, no
 * completeness gating — "has no counterpart" is decided per item inside one transaction, so
 * the old truncation ambiguity (orphans past `PAGE_SIZE * MAX_PAGES` simply never swept, and
 * a `.collect()` of the whole table walking into Convex's read limits) cannot exist.
 *
 * Objects whose `lastModified` is younger than `STORAGE_CLEANUP_DATA.GRACE_MS` (or unparsable)
 * are left alone — an in-flight upload has an object before it has a row, and without the
 * grace window this sweep would destroy it mid-flight.
 *
 * Safe to run bidirectionally because the R2 bucket is dedicated to this table — no other
 * feature stores keys here. If that ever changes, extend the reference check in phase 2 or
 * narrow the sweep to one direction.
 *
 * Overlapping chains (a cron firing while a previous chain still runs) only duplicate
 * work: conflicting transactions re-execute, re-read their page, and find the row already
 * gone — never a double delete.
 */
export const cleanupOrphanDataR2 = internalMutation({
	args: {
		phase: v.optional(v.union(v.literal('rows'), v.literal('objects'))),
		cursor: v.optional(v.string()),
		staleRows: v.optional(v.number()),
		staleObjects: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const phase = args.phase ?? 'rows';
		let staleRows = args.staleRows ?? 0;
		let staleObjects = args.staleObjects ?? 0;
		const self = internal.storage.crons.cleanupOrphanDataR2.cleanupOrphanDataR2;

		// ── Phase 1: rows whose R2 object is gone ───────────────────────────────
		if (phase === 'rows') {
			const { page, isDone, continueCursor } = await ctx.db
				.query('uploadedFilesR2')
				.paginate({ numItems: STORAGE_CLEANUP_DATA.BATCH, cursor: args.cursor ?? null });

			for (const row of page) {
				if ((await r2.getMetadata(ctx, row.key)) === null) {
					await ctx.db.delete(row._id);
					staleRows++;
				}
			}

			await ctx.scheduler.runAfter(
				0,
				self,
				isDone
					? { phase: 'objects' as const, staleRows, staleObjects }
					: { phase: 'rows' as const, cursor: continueCursor, staleRows, staleObjects }
			);
			return { phase, examined: page.length, staleRows, staleObjects, done: false };
		}

		// ── Phase 2: R2 objects no row references ───────────────────────────────
		const { page, isDone, continueCursor } = await r2.listMetadata(
			ctx,
			STORAGE_CLEANUP_DATA.BATCH,
			args.cursor ?? null
		);

		const cutoff = Date.now() - STORAGE_CLEANUP_DATA.GRACE_MS;
		for (const meta of page) {
			// Unparsable timestamp → can't prove the object is old → never delete it.
			const modifiedAt = Date.parse(meta.lastModified);
			if (Number.isNaN(modifiedAt) || modifiedAt > cutoff) continue;
			const ref = await ctx.db
				.query('uploadedFilesR2')
				.withIndex('by_key', (q) => q.eq('key', meta.key))
				.first();
			if (ref === null) {
				await r2.deleteObject(ctx, meta.key);
				staleObjects++;
			}
		}

		if (!isDone) {
			await ctx.scheduler.runAfter(0, self, {
				phase: 'objects' as const,
				cursor: continueCursor,
				staleRows,
				staleObjects
			});
			return { phase, examined: page.length, staleRows, staleObjects, done: false };
		}

		if (staleRows || staleObjects) {
			console.warn('[cleanupOrphanDataR2] cleaned orphans', { staleRows, staleObjects });
		}
		return { phase, examined: page.length, staleRows, staleObjects, done: true };
	}
});
