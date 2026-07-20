// LIBRARIES
import { v } from 'convex/values';
import { internal } from '@/convex/_generated/api';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// TYPES
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

/**
 * Admin-facing escape hatch — recompute a user's `rewardAccounts` counters by replaying
 * the append-only ledger (internal `rebuildRewardAccount`). Safe to run any time: the
 * ledger is the source of truth, so a rebuild on a healthy account is a no-op.
 */
export const adminRebuildRewardAccount = adminMutation('rebuildRewardAccount')({
	args: { userId: v.string() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		await ctx.runMutation(
			internal.tables.rewardAccounts.mutations.rebuildRewardAccount.rebuildRewardAccount,
			{ userId: args.userId }
		);

		ctx.audit(AUDIT_ACTIONS.REWARD_ACCOUNT_REBUILD, {
			resource: { table: 'rewardAccounts', id: args.userId }
		});

		return { success: true, message: { key: 'RewardMessages.ACCOUNT_REBUILT' } };
	}
});
