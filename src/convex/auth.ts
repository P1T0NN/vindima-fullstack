// LIBRARIES
import { v } from 'convex/values';

// AUTH
import { authComponent } from './betterAuth/config';
import { getAuthUserId } from './betterAuth/helpers/getAuthUserId';

// HELPERS
import { query } from './_generated/server';
import { getRewardsSnapshot } from './tables/rewardAccounts/helpers/getRewardsSnapshot';

/** The signed-in user and the per-user state shared by authenticated UI surfaces. */
export const getCurrentUser = query({
	args: {},
	returns: v.any(),
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;

		const userId = await getAuthUserId(ctx);
		const rewards = userId ? await getRewardsSnapshot(ctx, userId) : null;

		return { ...user, role: user.role ?? undefined, rewards };
	}
});
