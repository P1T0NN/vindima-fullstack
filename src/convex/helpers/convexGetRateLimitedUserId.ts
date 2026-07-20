// LIBRARIES
import { ConvexError } from 'convex/values';
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// UTILS
import { convexRateLimiter } from '@/convex/convexRateLimiter';

// TYPES
import type { ActionCtx, MutationCtx } from '@/convex/_generated/server';
import type { ConvexRateLimitName } from '@/convex/rateLimits/registry';
import type { ConvexErrorPayload } from '@/convex/types/convexTypes';

/**
 * Assert auth AND charge {@link convexRateLimiter} in one call. Bucket is keyed by
 * the authenticated user id (per-user limit).
 *
 * Throws:
 * - `NOT_AUTHENTICATED` (typed {@link ConvexErrorPayload}) if the caller is anonymous.
 * - `RateLimitError` from {@link convexRateLimiter} (`throws: true`) if the bucket is empty.
 *
 * Anonymous callers are rejected on purpose: a global anon bucket would be a DoS
 * multiplier (one attacker locks out every legitimate anon caller). Endpoints that
 * intentionally allow anon traffic should call `convexRateLimiter.limit` directly with
 * an explicit key (IP, anon session id, etc.).
 *
 * @param name  Function name from {@link convexRateLimitRegistry}. Must match the export name.
 * @param count Token weight to consume. Defaults to 1. Use `ids.length` (or similar) for
 *              bulk endpoints so a request that does N units of work pays N tokens.
 */
export const convexGetRateLimitedUserId = async (
	ctx: MutationCtx | ActionCtx,
	name: ConvexRateLimitName,
	count?: number
): Promise<string> => {
	const userId = await getAuthUserId(ctx);

	if (!userId) {
		throw new ConvexError({
			code: 'NOT_AUTHENTICATED',
			message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
		} satisfies ConvexErrorPayload);
	}

	await convexRateLimiter.limit(ctx, name, { key: userId, count, throws: true });
	return userId;
};
