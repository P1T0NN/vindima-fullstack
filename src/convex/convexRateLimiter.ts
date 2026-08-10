// LIBRARIES
import { RateLimiter } from '@convex-dev/rate-limiter';
import { components } from './_generated/api';
import { convexRateLimitRegistry } from '@/shared/features/rateLimits/data/rateLimitsRegistry';

/**
 * App rate limiter backed by {@link convexRateLimitRegistry}.
 *
 * Use directly via `convexRateLimiter.limit(ctx, name, { key, count, throws: true })`.
 * For the common "auth user + limit" case, prefer
 * {@link import('./helpers/convexGetRateLimitedUserId').convexGetRateLimitedUserId}.
 */
export const convexRateLimiter = new RateLimiter(components.rateLimiter, convexRateLimitRegistry);
