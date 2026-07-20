/**
 * Admin read — one user's reward account counters for the /admin/users/[id] Rewards tab.
 * `null` = the user has never earned a stamp (no row yet); the UI renders zeros.
 */

// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// MIDDLEWARE
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

export const fetchRewardAccount = query({
	args: { userId: v.string() },
	handler: async (ctx, args): Promise<Doc<'rewardAccounts'> | null> => {
		await requireAdmin(ctx);
		return await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.unique();
	}
});
