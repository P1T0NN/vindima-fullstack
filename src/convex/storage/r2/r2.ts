// LIBRARIES
import { v } from 'convex/values';
import { R2, type R2Callbacks } from '@convex-dev/r2';
import { components, internal } from '../../_generated/api';

// HELPERS
import { getAuthUserId } from '../../auth/helpers/getAuthUserId.js';
import { logAudit } from '../../tables/auditLog/helpers/logAudit';
import { AUDIT_ACTIONS } from '../../tables/auditLog/auditLogConfigs';
import { authMutation } from '../../auth/middleware/authMiddleware';

// TYPES
import type { DataModel } from '../../_generated/dataModel';
import type { ConvexMutationResult } from '../../types/convexTypes.js';

/**
 * R2 client bound to the registered component. All server-side R2 work (upload URL minting,
 * metadata sync, getUrl, deleteObject) goes through this instance.
 */
export const r2 = new R2(components.r2);

/**
 * Mirrors the Convex-storage path in `storageMutations.ts` — keep the limits in lockstep
 * so swapping backends doesn't change UX or the trust boundary.
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_CONTENT_TYPES = new Set<string>([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/pdf'
]);

/**
 * Custom upload-URL minter. We DO NOT export the package's built-in `generateUploadUrl`
 * because its `checkUpload` hook only gets a `QueryCtx` — there's no way to charge a
 * rate-limit token there. If we did rate-limit later in `onUpload`, a throw on a full
 * bucket would roll back the mutation while the R2 object had already been PUT, leaving
 * an orphan. Instead we charge the rate-limit + auth here, BEFORE the signed URL is
 * minted: any failure means no URL, no PUT, no orphan possible.
 */
export const generateR2UploadUrl = authMutation('generateR2UploadUrl')({
	args: {},
	returns: v.object({
		success: v.boolean(),
		message: v.object({
			key: v.string(),
			params: v.optional(v.record(v.string(), v.union(v.string(), v.float64(), v.boolean())))
		}),
		data: v.optional(v.object({ url: v.string(), key: v.string() }))
	}),
	handler: async (): Promise<ConvexMutationResult<{ url: string; key: string }>> => {
		// `authMutation` already handled auth + rate-limit before we got here.
		const minted = await r2.generateUploadUrl();
		return {
			success: true,
			message: { key: 'GenericMessages.UPLOAD_URL_READY' },
			data: minted
		};
	}
});

/**
 * Lifecycle hooks for the R2 sync pipeline. The library's flow is:
 *
 *   1. (Our) `generateR2UploadUrl` mutation above mints the signed URL.
 *   2. Browser PUTs the file to R2.
 *   3. `syncMetadata` mutation runs `checkUpload` then `onUpload`, then schedules the
 *      component's internal `syncMetadata` action.
 *   4. Component action HEADs R2, writes metadata into its own table, then invokes
 *      `callbacks.onSyncMetadata` (our `onSyncMetadata` callback).
 *
 * Orphan policy (no.1 priority):
 *
 *   - `checkUpload` is a no-op. The signed URL itself is proof of prior authorization;
 *     re-checking auth here just creates a window where a token expiring between PUT and
 *     syncMetadata orphans the R2 object.
 *   - `onUpload` is built to never throw. If auth is somehow gone we skip the insert and
 *     let `onSyncMetadata` notice the row-less object and delete it. If auth is present
 *     we insert. The DB insert in a healthy Convex deployment does not fail.
 *   - `onSyncMetadata` is the canonical reconciliation point: it sees both the row (or
 *     lack of one) and the real R2 metadata. It NEVER throws — throwing would roll back
 *     the cleanup deletes themselves. It always converges to a consistent state:
 *       row + valid object  → patch row.url
 *       row + bad/missing object → delete row + delete object
 *       no row + any object  → delete object (orphan from auth-lost onUpload path)
 *
 * Trade-off: server-side validation rejections are silent (no toast). Catch invalid
 * uploads on the client before the PUT for fast feedback; the server check is the
 * defense-in-depth backstop that guarantees consistency.
 */

// @ts-expect-error Just an any error
export const { syncMetadata, onSyncMetadata } = r2.clientApi<DataModel>({
	checkUpload: async () => {
		// No-op by design — see "Orphan policy" above.
	},
	onUpload: async (ctx, _bucket, key) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			// Auth lost between URL mint and here. Skip the insert; `onSyncMetadata`
			// will see no row for this key and delete the R2 object. Do NOT throw —
			// throwing rolls back the mutation and the lib.syncMetadata schedule with
			// it, which would prevent the cleanup callback from ever firing.
			console.warn('[r2.onUpload] auth lost after URL mint, will clean up via onSyncMetadata', {
				key
			});
			return;
		}
		const id = await ctx.db.insert('uploadedFilesR2', {
			ownerId: userId,
			key,
			url: ''
		});
		logAudit(ctx, AUDIT_ACTIONS.FILE_UPLOAD, {
			userId,
			resource: { table: 'uploadedFilesR2', id },
			after: { key }
		});
	},
	callbacks: {
		// Self-reference: the component invokes this internal mutation after its
		// syncMetadata action populates the metadata table. The cast breaks the TS
		// cycle ("onSyncMetadata implicitly any in its own initializer") — at runtime
		// it's just a function-handle path that resolves fine.
		onSyncMetadata: internal.storage.r2.r2.onSyncMetadata as R2Callbacks['onSyncMetadata']
	},
	onSyncMetadata: async (ctx, { key }) => {
		const row = await ctx.db
			.query('uploadedFilesR2')
			.withIndex('by_key', (q) => q.eq('key', key))
			.unique();

		// Orphan from the auth-lost path in onUpload (or any other case where the row
		// was never inserted). Object has no owner — drop it.
		if (!row) {
			console.warn('[r2.onSyncMetadata] no row for key, deleting orphan R2 object', { key });
			await r2.deleteObject(ctx, key);
			return;
		}

		const cleanup = async (reason: string) => {
			console.warn(`[r2.onSyncMetadata] rejecting upload (${reason}), cleaning up`, { key });
			await ctx.db.delete(row._id);
			await r2.deleteObject(ctx, key);
		};

		const meta = await r2.getMetadata(ctx, key);
		if (!meta) {
			await cleanup('metadata missing after sync');
			return;
		}
		if (typeof meta.size === 'number' && meta.size > MAX_UPLOAD_BYTES) {
			await cleanup(`too large (${meta.size}b > ${MAX_UPLOAD_BYTES}b)`);
			return;
		}
		if (!ALLOWED_CONTENT_TYPES.has(meta.contentType ?? '')) {
			await cleanup(`disallowed content type (${meta.contentType ?? 'unknown'})`);
			return;
		}

		// Accept: backfill the cached URL on the row so list/grid reads don't pay a
		// per-row R2 round-trip later.
		const url = await r2.getUrl(key);
		await ctx.db.patch(row._id, { url });
	}
});
