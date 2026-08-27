// LIBRARIES
import {
	customAction,
	customCtx,
	customMutation,
	customQuery
} from 'convex-helpers/server/customFunctions';
import {
	action as rawAction,
	internalMutation as rawInternalMutation,
	mutation as rawMutation,
	query as rawQuery,
	type ActionCtx,
	type MutationCtx,
	type QueryCtx
} from '../_generated/server.js';
import { v } from 'convex/values';

// AGGREGATES
import { aggregateTriggers } from '../aggregates/triggersAggregate.js';

// AUTH
import { requireAdminIdentity, requireIdentity } from '../betterAuth/helpers/requireIdentity.js';
import { enforceRateLimit } from '../rateLimits/helpers/enforceRateLimit.js';

// CONFIG
import { STORAGE_CONFIG } from '../../shared/features/storage/config.js';

// TYPES
import type { Doc } from '../_generated/dataModel.js';
import type { RateLimitedFunctionOptions } from '../rateLimits/types/rateLimitTypes.js';

const publicMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		await enforceRateLimit(ctx, options.rateLimit);
		return aggregateTriggers.wrapDB(ctx);
	}
);

const publicActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		await enforceRateLimit(ctx, options.rateLimit);
		return {};
	}
);

const getAuthenticatedMutationContext = async (
	ctx: MutationCtx,
	options: RateLimitedFunctionOptions,
	getIdentity: typeof requireIdentity = requireIdentity
) => {
	const identity = await getIdentity(ctx);
	await enforceRateLimit(ctx, options.rateLimit, identity);
	const wrappedContext = aggregateTriggers.wrapDB(ctx);

	return { db: wrappedContext.db, identity };
};

const authenticatedMutationContext = customCtx(getAuthenticatedMutationContext);

const authenticatedActionContext = customCtx(
	async (ctx: ActionCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);

		return { identity };
	}
);

const authenticatedQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireIdentity(ctx)
}));

const adminMutationContext = customCtx(
	async (ctx: MutationCtx, options: RateLimitedFunctionOptions) => {
		const identity = await requireAdminIdentity(ctx);
		await enforceRateLimit(ctx, options.rateLimit, identity);
		const wrappedContext = aggregateTriggers.wrapDB(ctx);

		return { db: wrappedContext.db, identity };
	}
);

const adminQueryContext = customCtx(async (ctx: QueryCtx) => ({
	identity: await requireAdminIdentity(ctx)
}));

export const mutation = customMutation(rawMutation, publicMutationContext);
export const action = customAction(rawAction, publicActionContext);
export const authenticatedMutation = customMutation(rawMutation, authenticatedMutationContext);

function isFailedMutationResult(result: unknown): boolean {
	return (
		result === false ||
		(typeof result === 'object' &&
			result !== null &&
			'success' in result &&
			(result as { success?: unknown }).success === false)
	);
}

const createUploadMutation = (getIdentity: typeof requireIdentity) =>
	customMutation(rawMutation, {
		args: {
			uploadedFiles: v.optional(v.array(v.string())),
			retainedFiles: v.optional(v.array(v.string()))
		},
		input: async (
			ctx: MutationCtx,
			args: { uploadedFiles?: string[]; retainedFiles?: string[] },
			options: RateLimitedFunctionOptions
		) => {
			const authenticated = await getAuthenticatedMutationContext(ctx, options, getIdentity);
			const keys = args.uploadedFiles;
			if (keys && keys.length > STORAGE_CONFIG.maxFilesPerUpload) {
				throw new Error(`You can upload at most ${STORAGE_CONFIG.maxFilesPerUpload} files`);
			}
			if (keys && new Set(keys).size !== keys.length) throw new Error('Duplicate upload key');

			const uploads: Doc<'storageUploads'>[] = [];
			for (const key of keys ?? []) {
				const upload = await ctx.db
					.query('storageUploads')
					.withIndex('by_key', (query) => query.eq('key', key))
					.unique();
				if (
					!upload ||
					upload.ownerId !== authenticated.identity.tokenIdentifier ||
					upload.status !== 'uploaded'
				) {
					throw new Error('Upload not found');
				}
				uploads.push(upload);
			}

			return {
				ctx: authenticated,
				args: { uploadedFiles: keys, retainedFiles: args.retainedFiles },
				onSuccess: async ({ result }: { result: unknown }) => {
					if (isFailedMutationResult(result)) return;
					for (const upload of uploads) await ctx.db.delete(upload._id);
				}
			};
		}
	});

export const authenticatedUploadMutation = createUploadMutation(requireIdentity);
export const adminUploadMutation = createUploadMutation(requireAdminIdentity);
export const authenticatedAction = customAction(rawAction, authenticatedActionContext);
export const authenticatedQuery = customQuery(rawQuery, authenticatedQueryContext);
export const adminMutation = customMutation(rawMutation, adminMutationContext);
export const adminQuery = customQuery(rawQuery, adminQueryContext);

export const internalMutation = customMutation(
	rawInternalMutation,
	customCtx(aggregateTriggers.wrapDB)
);
