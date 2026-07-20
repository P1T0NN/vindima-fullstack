// LIBRARIES
import { query } from '../../_generated/server';
import { authComponent } from '../auth';

// AUTH
import { getAuthUserId } from '../helpers/getAuthUserId';

// HELPERS
import { getRewardsSnapshot } from '@/convex/tables/rewards/helpers/getRewardsSnapshot';

/**
 * The signed-in user plus their per-user app state (`rewards`), in one query. The root layout
 * holds the single subscription (SSR-preloaded in `+layout.server.ts`) and mirrors it into
 * `authClass`, so every surface reads user + rewards from one place with no extra round trips.
 */
export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		const user = await authComponent.getAuthUser(ctx);
		if (!user) return null;

		const userId = await getAuthUserId(ctx);

		const rewards = userId ? await getRewardsSnapshot(ctx, userId) : null;

		return {
			...user,
			rewards
		};
	}
});
