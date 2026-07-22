// LIBRARIES
import { v } from 'convex/values';
import { internalQuery } from '@/convex/_generated/server';

// AUTH (user email lookup)
import { authComponent } from '@/convex/auth/auth';

// TYPES
import type { RewardEmailData } from '@/shared/features/emails/types/emailsTypes';

/**
 * Resolve a reward account's owner (email + name via the auth component) and current card
 * balance, for the reward emails. Returns `null` if the user or their email can't be found.
 */
export const getRewardEmailData = internalQuery({
	args: { userId: v.string() },
	handler: async (ctx, args): Promise<RewardEmailData | null> => {
		const user = (await authComponent.getAnyUserById(ctx, args.userId)) as {
			email?: string;
			name?: string;
		} | null;
		if (!user?.email) return null;

		const account = await ctx.db
			.query('rewardAccounts')
			.withIndex('by_user', (q) => q.eq('userId', args.userId))
			.unique();

		return {
			email: user.email,
			name: user.name ?? '',
			stamps: account?.stamps ?? 0,
			availableRewards: account?.availableRewards ?? 0
		};
	}
});
