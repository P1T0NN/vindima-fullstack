// CONFIG
import { REWARDS_CONFIG } from '@/shared/config.js';

// AUTH
import { authComponent } from '@/convex/auth/auth';

// TYPES
import type { QueryCtx, MutationCtx } from '@/convex/_generated/server';

/**
 * Is `userId` eligible for the first-purchase discount right now? (RewardSystem.md §15.5.)
 *
 * True only when: the feature is on (`DISCOUNT_PERCENT` non-null), the user has no
 * `firstPurchases` row (never purchased), and — when `REQUIRE_VERIFIED_EMAIL` is set — the
 * user's email is verified. Independent of `FEATURES.REWARDS`; never reads reward tables.
 *
 * Shared by `fetchMyRewards` (current user) and the future checkout hook (server-side).
 * Checks are ordered cheapest-first: a config compare, then one indexed point-read, then the
 * user lookup only if the verified-email gate is on — so the common ineligible cases cost O(1).
 *
 * Not a registered Convex function — a plain helper so both the query and checkout share one path.
 */
export async function getWelcomeOfferEligibility(
	ctx: QueryCtx | MutationCtx,
	userId: string
): Promise<boolean> {
	const { DISCOUNT_PERCENT, REQUIRE_VERIFIED_EMAIL } = REWARDS_CONFIG.FIRST_PURCHASE;
	if (DISCOUNT_PERCENT === null) return false;

	// The one durable fact: any prior paid order (discounted or not) settles the offer forever.
	const purchased = await ctx.db
		.query('firstPurchases')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.unique();
	if (purchased) return false;

	if (REQUIRE_VERIFIED_EMAIL) {
		const user = await authComponent.getAnyUserById(ctx, userId);
		if (!user || (user as { emailVerified?: boolean }).emailVerified !== true) return false;
	}

	return true;
}
