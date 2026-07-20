// LIBRARIES
import { ConvexError, v } from 'convex/values';

// CONVEX
import { mutation } from '../_generated/server';
import { convexRateLimiter } from '../convexRateLimiter';
import { getAuthUserId } from '../auth/helpers/getAuthUserId';

// CONFIG
import { convexRateLimitRegistry } from './registry';

// TYPES
import type { ConvexErrorPayload } from '../types/convexTypes';
import type { ConvexRateLimitName } from './registry';

const SEARCH_LIMIT_SECRET_ENV = 'SEARCH_INPUT_RATE_LIMIT_SECRET';
const AUTHENTICATED_KEY_MODES = ['user', 'fallback', 'userAndFallback'] as const;

type AuthenticatedKeyMode = (typeof AUTHENTICATED_KEY_MODES)[number];

/**
 * Trusted server-side bridge for public search rate limits.
 *
 * SvelteKit remote functions can resolve a trusted anonymous fallback key, but only
 * Convex can cheaply resolve the authenticated user id from the verified auth token.
 * This mutation upgrades signed-in callers to a user-scoped key before charging the
 * token bucket, then the remote function runs the read-only search query. The shared
 * secret keeps browser clients from calling this mutation directly with arbitrary
 * victim keys.
 */
export const consumeSearchRateLimit = mutation({
	args: {
		name: v.string(),
		source: v.string(),
		fallbackKey: v.string(),
		authenticatedKey: v.union(
			v.literal('user'),
			v.literal('fallback'),
			v.literal('userAndFallback')
		),
		secret: v.string()
	},
	handler: async (ctx, args) => {
		const expectedSecret = process.env[SEARCH_LIMIT_SECRET_ENV];
		if (!expectedSecret) {
			throw new Error(`[consumeSearchRateLimit] Missing ${SEARCH_LIMIT_SECRET_ENV}.`);
		}

		if (args.secret !== expectedSecret) {
			throw new ConvexError({
				code: 'FORBIDDEN',
				message: { key: 'GenericMessages.FORBIDDEN' }
			} satisfies ConvexErrorPayload);
		}

		if (!(args.name in convexRateLimitRegistry)) {
			throw new Error(`[consumeSearchRateLimit] Unknown rate-limit bucket "${args.name}".`);
		}

		const userId = await getAuthUserId(ctx);
		const key = resolveSearchRateLimitKey({
			source: args.source,
			fallbackKey: args.fallbackKey,
			authenticatedKey: args.authenticatedKey,
			userId
		});

		await convexRateLimiter.limit(ctx, args.name as ConvexRateLimitName, {
			key,
			throws: true
		});
	}
});

function resolveSearchRateLimitKey({
	source,
	fallbackKey,
	authenticatedKey,
	userId
}: {
	source: string;
	fallbackKey: string;
	authenticatedKey: AuthenticatedKeyMode;
	userId: string | null;
}): string {
	if (!userId) return fallbackKey;

	if (authenticatedKey === 'fallback') return fallbackKey;
	if (authenticatedKey === 'userAndFallback') {
		return `search-input:${source}:user:${userId}:fallback:${fallbackKey}`;
	}

	return `search-input:${source}:user:${userId}`;
}
