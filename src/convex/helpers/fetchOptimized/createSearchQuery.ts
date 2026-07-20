// `createSearchQuery` — dropdown/autocomplete search factory, the deliberately narrow
// sibling of `fetchOptimized` (search indexes only, cursor only, server-capped page
// size, optional trusted-server gate). Built on the same kit — auth gate, rate limit,
// and search-chain building live in ./kit.ts. Guide: ./README.md § createSearchQuery.

// LIBRARIES
import { paginationOptsValidator, type PaginationOptions } from 'convex/server';
import { ConvexError, v } from 'convex/values';
import { query } from '../../_generated/server';

// CONFIG
import { PAGINATION_DATA } from '@/shared/config.js';

// HELPERS
import { applySearchChain, checkAdvisoryRateLimit, paginationGuard } from './kit.js';

// TYPES
import type { QueryCtx } from '../../_generated/server';
import type { ConvexErrorPayload } from '../../types/convexTypes.js';
import type { ConvexRateLimitName } from '../../rateLimits/registry.js';
import type { Doc, TableNames } from '../../_generated/dataModel';
import type { ObjectType, PropertyValidators } from 'convex/values';
import type { FetchOptimizedAuth, FetchOptimizedSearch } from './types.js';

/** Endpoint gate — same values and semantics as {@link FetchOptimizedAuth}. */
export type SearchQueryAuth = FetchOptimizedAuth;

/** Resolved caller identity handed to the `search` builder as its third argument. */
export type SearchQueryAuthContext = {
	userId: string | null;
	auth: SearchQueryAuth;
};

/** Schema-correlated search spec — same shape `fetchOptimized`'s search mode uses. */
export type SearchQuerySpec<T extends TableNames> = FetchOptimizedSearch<T>;

type BuiltinArgs = {
	paginationOpts?: PaginationOptions;
	trustedSearchSecret?: string;
};

type SearchBuilder<Extra, T extends TableNames> = (
	ctx: QueryCtx,
	args: BuiltinArgs & Extra,
	auth: SearchQueryAuthContext
) => Promise<SearchQuerySpec<T> | null | undefined> | SearchQuerySpec<T> | null | undefined;

/** Slim payload for dropdowns — no `totalCount` (cursor-only, counts are meaningless). */
export type SearchQueryResult<T extends TableNames> = {
	page: Doc<T>[];
	isDone: boolean;
	continueCursor: string;
};

export type CreateSearchQueryOptions<T extends TableNames, Extra extends PropertyValidators> = {
	/** Target table. Return docs are typed from this table. */
	table: T;
	/** Endpoint-level auth gate. Defaults to `'public'` (dropdown suggestions). */
	auth?: SearchQueryAuth;
	/** Extra Convex validators consumed by the `search` builder. */
	args?: Extra;
	/**
	 * Builds the search-index access spec. Returning null/undefined returns an empty page
	 * (useful when the caller has not typed enough text yet).
	 */
	search: SearchBuilder<ObjectType<Extra>, T>;
	/**
	 * Minimum trimmed query length before Convex touches the search index. Defaults to 2.
	 * Set to 0 only for very small, intentionally browseable indexes.
	 */
	minQueryLength?: number;
	/** Server fallback when the caller omits `paginationOpts.numItems`. */
	defaultNumItems?: number;
	/** Hard cap for `paginationOpts.numItems`, regardless of what the client asks for. */
	maxNumItems?: number;
	/**
	 * Optional trusted-server gate for public search queries that must only be called
	 * through a SvelteKit remote/server adapter. When set, callers must pass
	 * `trustedSearchSecret` matching this Convex environment variable.
	 */
	trustedSecretEnvName?: string | null;
};

/**
 * Build a reusable Convex query for dropdown/autocomplete search. Intentionally narrower
 * than `fetchOptimized`: search indexes only, cursor only, server-side result cap.
 *
 * Public search note: anonymous callers are deliberately NOT rate-limit checked here
 * (Convex queries expose no trustworthy anonymous key). For enforceable anonymous
 * throttling, front this query with a SvelteKit remote/server route keyed by IP and use
 * {@link CreateSearchQueryOptions.trustedSecretEnvName} so only that route can call it.
 * Full rationale + example: README § createSearchQuery.
 */
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(name: ConvexRateLimitName, options: CreateSearchQueryOptions<T, Extra>): ReturnType<typeof query>;
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(options: CreateSearchQueryOptions<T, Extra>): ReturnType<typeof query>;
export function createSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(
	nameOrOptions: ConvexRateLimitName | CreateSearchQueryOptions<T, Extra>,
	maybeOptions?: CreateSearchQueryOptions<T, Extra>
) {
	const rateLimitName = typeof nameOrOptions === 'string' ? nameOrOptions : null;
	const options =
		typeof nameOrOptions === 'string'
			? (maybeOptions as CreateSearchQueryOptions<T, Extra>)
			: nameOrOptions;

	return buildSearchQuery(options, rateLimitName);
}

function buildSearchQuery<
	T extends TableNames,
	Extra extends PropertyValidators = Record<string, never>
>(options: CreateSearchQueryOptions<T, Extra>, rateLimitName: ConvexRateLimitName | null) {
	const {
		table,
		auth = 'public',
		args: extraArgs,
		search,
		minQueryLength = 2,
		defaultNumItems = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		maxNumItems = PAGINATION_DATA.MAX_PAGE_SIZE,
		trustedSecretEnvName = null
	} = options;

	const validators = {
		...(extraArgs ?? {}),
		paginationOpts: v.optional(paginationOptsValidator),
		trustedSearchSecret: v.optional(v.string())
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any;

	return query({
		args: validators,
		handler: async (ctx: QueryCtx, rawArgsRaw): Promise<SearchQueryResult<T>> => {
			const rawArgs = rawArgsRaw as BuiltinArgs & ObjectType<Extra>;
			assertTrustedSearchCaller(rawArgs.trustedSearchSecret, trustedSecretEnvName);

			// Auth via the shared gate. Rate limiting is deferred below the min-length
			// check so empty/short queries never trip an exhausted bucket. Public + rate
			// limit still wants the user id for the bucket key → resolve it optionally.
			const userId = await paginationGuard(ctx, {
				auth: auth === 'public' && rateLimitName ? 'optionalUser' : auth
			});
			const authContext: SearchQueryAuthContext = { auth, userId };

			const searchSpec = await search(ctx, rawArgs, authContext);
			if (!searchSpec) return emptySearchResult();

			const trimmedQuery = searchSpec.query.trim();
			if (trimmedQuery.length < minQueryLength) return emptySearchResult();

			// Anonymous callers are deliberately skipped (no trustworthy key) — see the
			// factory JSDoc for the trusted-route pattern that covers them.
			if (rateLimitName && userId) {
				await checkAdvisoryRateLimit(ctx, rateLimitName, userId);
			}

			const paginationOpts = resolveSearchPaginationOpts({
				opts: rawArgs.paginationOpts,
				defaultNumItems,
				maxNumItems
			});

			const result = await ctx.db
				.query(table)
				.withSearchIndex(searchSpec.index, (sb) =>
					applySearchChain(sb, searchSpec.searchField as string, trimmedQuery, searchSpec.eq)
				)
				.paginate(paginationOpts);

			return {
				page: result.page as Doc<T>[],
				isDone: result.isDone,
				continueCursor: result.continueCursor
			};
		}
	});
}

function assertTrustedSearchCaller(
	trustedSearchSecret: string | undefined,
	trustedSecretEnvName: string | null
): void {
	if (!trustedSecretEnvName) return;

	const expectedSecret = process.env[trustedSecretEnvName];
	if (!expectedSecret) {
		throw new Error(`[createSearchQuery] Missing ${trustedSecretEnvName}.`);
	}

	if (trustedSearchSecret !== expectedSecret) {
		throw new ConvexError({
			code: 'FORBIDDEN',
			message: { key: 'GenericMessages.FORBIDDEN' }
		} satisfies ConvexErrorPayload);
	}
}

function resolveSearchPaginationOpts(params: {
	opts: PaginationOptions | undefined;
	defaultNumItems: number;
	maxNumItems: number;
}): PaginationOptions {
	const maxNumItems = normalizePositiveInt(params.maxNumItems, PAGINATION_DATA.MAX_PAGE_SIZE);
	const defaultNumItems = Math.min(
		maxNumItems,
		normalizePositiveInt(params.defaultNumItems, PAGINATION_DATA.DEFAULT_PAGE_SIZE)
	);
	const requestedNumItems =
		params.opts?.numItems === undefined
			? defaultNumItems
			: normalizePositiveInt(params.opts.numItems, defaultNumItems);

	return {
		cursor: params.opts?.cursor ?? null,
		numItems: Math.min(requestedNumItems, maxNumItems)
	};
}

function normalizePositiveInt(value: number, fallback: number): number {
	if (!Number.isFinite(value)) return fallback;
	return Math.max(1, Math.floor(value));
}

function emptySearchResult<T extends TableNames>(): SearchQueryResult<T> {
	return {
		page: [],
		isDone: true,
		continueCursor: ''
	};
}
