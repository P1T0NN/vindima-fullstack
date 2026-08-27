// LIBRARIES
import { R2 } from '@convex-dev/r2';
import { v } from 'convex/values';
import { components } from '../_generated/api.js';
import { authenticatedMutation, internalMutation } from '../builders/convexFunctionBuilders.js';
import { requireIdentity } from '../betterAuth/helpers/requireIdentity.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// TYPES
import type { DataModel } from '../_generated/dataModel.js';
import type { MutationCtx } from '../_generated/server.js';

export const r2 = new R2(components.r2, {
	bucket: process.env.STORAGE_BUCKET_NAME,
	endpoint: process.env.STORAGE_ENDPOINT,
	accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
	secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY
});

const clientApi = r2.clientApi<DataModel>({
	checkUpload: async (ctx) => {
		await requireIdentity(ctx);
	},
	onUpload: async (ctx, _bucket, key) => {
		const identity = await requireIdentity(ctx);
		const upload = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', key))
			.unique();
		if (!upload || upload.ownerId !== identity.tokenIdentifier || upload.status !== 'pending') {
			throw new Error('Upload not found');
		}
		await ctx.db.patch(upload._id, { status: 'uploaded' });
	},
	checkDelete: async (ctx, _bucket, key) => {
		const identity = await requireIdentity(ctx);
		const upload = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', key))
			.unique();
		if (!upload || upload.ownerId !== identity.tokenIdentifier) {
			throw new Error('Upload not found');
		}
	},
	onDelete: async (ctx, _bucket, key) => {
		const upload = await ctx.db
			.query('storageUploads')
			.withIndex('by_key', (query) => query.eq('key', key))
			.unique();
		if (upload) await ctx.db.delete(upload._id);
	}
});

export const syncMetadata = clientApi.syncMetadata;
export const deleteObject = clientApi.deleteObject;

function normalizeUploadNamespace(namespace: string | undefined): string | undefined {
	if (namespace === undefined) return undefined;

	const normalized = namespace.trim().replace(/^\/+|\/+$/g, '');
	if (!normalized) return undefined;

	const segments = normalized.split('/');
	if (
		segments.some((segment) => {
			if (segment === '' || segment === '.' || segment === '..' || segment.includes('\\')) {
				return true;
			}
			return [...segment].some((character) => {
				const code = character.charCodeAt(0);
				return code <= 0x1f || code === 0x7f;
			});
		})
	) {
		throw new Error('Invalid upload namespace');
	}

	return segments.join('/');
}

export const generateUploadUrl = authenticatedMutation({
	rateLimit: { name: 'storage:upload' },
	args: { namespace: v.optional(v.string()) },
	returns: v.object({ key: v.string(), url: v.string() }),
	handler: async (ctx, args) => {
		const namespace = normalizeUploadNamespace(args.namespace);
		const customKey = namespace ? `${namespace}/${crypto.randomUUID()}` : undefined;
		const upload = await r2.generateUploadUrl(customKey);
		await ctx.db.insert('storageUploads', {
			ownerId: ctx.identity.tokenIdentifier,
			key: upload.key,
			status: 'pending',
			createdAt: Date.now()
		});
		return upload;
	}
});

export const cleanupStaleUploads = internalMutation({
	args: {},
	returns: v.number(),
	handler: async (ctx) => {
		const staleUploads = await ctx.db
			.query('storageUploads')
			.withIndex('by_created_at', (query) =>
				query.lt('createdAt', Date.now() - STORAGE_CONFIG.uploadTtlMinutes * 60_000)
			)
			.take(STORAGE_CONFIG.cleanupBatchSize);

		for (const upload of staleUploads) {
			await r2.deleteObject(ctx, upload.key);
			await ctx.db.delete(upload._id);
		}
		return staleUploads.length;
	}
});

export const deleteStoredFile = internalMutation({
	args: { key: v.string() },
	returns: v.null(),
	handler: async (ctx, args) => {
		await r2.deleteObject(ctx, args.key);
		return null;
	}
});

function storedFileKey(value: string): string | undefined {
	// Root-relative URLs belong to the app's public directory, not R2.
	if (!/^https?:\/\//i.test(value)) return value.startsWith('/') ? undefined : value;

	try {
		const file = new URL(value);
		const publicUrl = process.env.STORAGE_PUBLIC_URL;
		if (publicUrl) {
			const base = new URL(publicUrl);
			const basePath = `${base.pathname.replace(/\/+$/, '')}/`;
			if (file.origin === base.origin && file.pathname.startsWith(basePath)) {
				const key = file.pathname.slice(basePath.length);
				return key ? decodeURIComponent(key) : undefined;
			}
		}

		const endpointValue = process.env.STORAGE_ENDPOINT;
		const bucket = process.env.STORAGE_BUCKET_NAME;
		if (!endpointValue || !bucket) return undefined;

		const endpoint = new URL(endpointValue);
		const endpointPath = endpoint.pathname.replace(/\/+$/, '');
		const sameServer = file.protocol === endpoint.protocol && file.port === endpoint.port;
		let key: string | undefined;

		if (sameServer && file.hostname === `${bucket}.${endpoint.hostname}`) {
			const prefix = `${endpointPath}/`;
			if (file.pathname.startsWith(prefix)) key = file.pathname.slice(prefix.length);
		} else if (file.origin === endpoint.origin) {
			const prefix = `${endpointPath}/${encodeURIComponent(bucket)}/`;
			if (file.pathname.startsWith(prefix)) key = file.pathname.slice(prefix.length);
		}

		return key ? decodeURIComponent(key) : undefined;
	} catch {
		return undefined;
	}
}

export async function deleteStoredFiles(
	ctx: MutationCtx,
	files: string[],
	preserve: string[] = []
): Promise<void> {
	const preservedKeys = new Set(
		preserve.map(storedFileKey).filter((key): key is string => Boolean(key))
	);
	const keys = new Set(
		files
			.map(storedFileKey)
			.filter((key): key is string => Boolean(key))
			.filter((key) => !preservedKeys.has(key))
	);
	for (const key of keys) await r2.deleteObject(ctx, key);
}

export async function resolveStoredFileUrls(keys: string[]): Promise<string[]> {
	const publicUrl = process.env.STORAGE_PUBLIC_URL?.replace(/\/+$/, '');
	return Promise.all(
		keys.map((key) => {
			if (key.startsWith('http://') || key.startsWith('https://')) return key;
			if (publicUrl) {
				return `${publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
			}
			return r2.getUrl(key, { expiresIn: 60 * 60 });
		})
	);
}
