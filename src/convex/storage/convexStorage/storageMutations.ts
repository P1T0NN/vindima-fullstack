// LIBRARIES
import { ConvexError, v } from 'convex/values';

// MIDDLEWARE
import { authMutation } from '../../auth/middleware/authMiddleware';

// AUDIT
import { AUDIT_ACTIONS } from '../../tables/auditLog/auditLogConfigs';

// TYPES
import type { ConvexErrorPayload } from '../../types/convexTypes.js';

/** Change this one line when copying this file into a new project. */
const TABLE = 'uploadedFiles' as const;

/**
 * File upload constraints — enforced server-side at the `saveUploadedFile` step.
 * The client-side picker should mirror these for UX, but the server is the trust
 * boundary: client checks are advisory only.
 */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
/** Allow-list of accepted MIME types. Add/remove per project needs. */
const ALLOWED_CONTENT_TYPES = new Set<string>([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/pdf'
]);

/**
 * Short-lived POST URL; response JSON includes `storageId`.
 *
 * Auth: any signed-in user. To gate behind admin instead, swap `authMutation`
 * for `adminMutation` (same shape, different role check) — apply to both
 * functions in this file so URL-gen and row-save stay in lockstep.
 */
export const generateConvexUploadUrl = authMutation('generateConvexUploadUrl')({
	args: {},
	handler: async (ctx) => {
		return await ctx.storage.generateUploadUrl();
	}
});

/**
 * Persist a file row after upload. Stamps the caller as `ownerId` so the row can
 * later be deleted through the owner path in {@link createDeleteMutation}.
 *
 * Validates against the storage metadata Convex recorded at upload time —
 * trustworthy regardless of any client-supplied content-type or size hints.
 */
export const saveUploadedFile = authMutation('saveUploadedFile')({
	args: {
		storageId: v.id('_storage')
	},
	handler: async (ctx, args) => {
		const meta = await ctx.db.system.get(args.storageId);
		if (!meta) {
			throw new ConvexError({
				code: 'UPLOAD_NOT_FOUND',
				message: { key: 'GenericMessages.UPLOAD_NOT_FOUND' }
			} satisfies ConvexErrorPayload);
		}
		if (meta.size > MAX_UPLOAD_BYTES) {
			await ctx.storage.delete(args.storageId);
			throw new ConvexError({
				code: 'UPLOAD_TOO_LARGE',
				message: { key: 'GenericMessages.UPLOAD_TOO_LARGE' }
			} satisfies ConvexErrorPayload);
		}
		if (!ALLOWED_CONTENT_TYPES.has(meta.contentType ?? '')) {
			await ctx.storage.delete(args.storageId);
			throw new ConvexError({
				code: 'UPLOAD_TYPE_NOT_ALLOWED',
				message: { key: 'GenericMessages.UPLOAD_TYPE_NOT_ALLOWED' }
			} satisfies ConvexErrorPayload);
		}

		const url = await ctx.storage.getUrl(args.storageId);
		if (!url) {
			throw new ConvexError({
				code: 'STORAGE_URL_UNAVAILABLE',
				message: { key: 'GenericMessages.STORAGE_URL_UNAVAILABLE' }
			} satisfies ConvexErrorPayload);
		}

		const id = await ctx.db.insert(TABLE, {
			ownerId: ctx.userId,
			storageId: args.storageId,
			url
		});
		ctx.audit(AUDIT_ACTIONS.FILE_UPLOAD, {
			resource: { table: TABLE, id },
			after: { storageId: args.storageId, contentType: meta.contentType, size: meta.size }
		});
		return id;
	}
});
