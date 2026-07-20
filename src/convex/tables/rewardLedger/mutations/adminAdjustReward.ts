// LIBRARIES
import { internal } from '@/convex/_generated/api';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { adjustRewardSchema } from '@/shared/features/rewardLedger/schemas/rewardLedgerSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/validationUtils';

// TYPES
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

/**
 * Admin-facing manual reward correction (the lever for edge cases the automatic rules
 * stay out of — e.g. clawing back a reward after an abusive refund, or goodwill stamps).
 * Input rules come from the SHARED `adjustRewardSchema` (whole-number deltas, not both
 * zero); this delegates to the internal `adjustReward` (ledger entry + account re-fold).
 */
export const adminAdjustReward = adminMutation('adminAdjustReward')({
	args: zodToConvexFields(adjustRewardSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const parsed = adjustRewardSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'RewardMessages.NOTHING_TO_ADJUST' } };
		}
		const stamps = parsed.data.stamps ?? 0;
		const rewards = parsed.data.rewards ?? 0;

		await ctx.runMutation(internal.tables.rewardLedger.mutations.adjustReward.adjustReward, {
			userId: args.userId,
			stamps,
			rewards,
			note: trimToUndefined(args.note)
		});

		ctx.audit(AUDIT_ACTIONS.REWARD_ADJUST, {
			resource: { table: 'rewardAccounts', id: args.userId },
			after: { stampsDelta: stamps, rewardsDelta: rewards }
		});

		return { success: true, message: { key: 'RewardMessages.REWARD_ADJUSTED' } };
	}
});
