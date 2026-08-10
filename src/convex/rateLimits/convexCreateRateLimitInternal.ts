// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';
import { convexRateLimiter } from '../convexRateLimiter';

// TYPES
import type { ConvexRateLimitName } from '@/shared/features/rateLimits/types/rateLimitsTypes';

/** Internal enforcement for {@link convexCreateRateLimit} (no mutation ctx on BA hooks). */
export const convexCreateRateLimitInternal = internalMutation({
	args: {
		name: v.string(),
		key: v.string()
	},
	handler: async (ctx, { name, key }) => {
		await convexRateLimiter.limit(ctx, name as ConvexRateLimitName, { key, throws: true });
	}
});
