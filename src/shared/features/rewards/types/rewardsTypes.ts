// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Per-user rewards state for every rewards UI surface (account card + picker, checkout line).
 * Produced by `getRewardsSnapshot` on the server; rides on `getCurrentUser` so every surface
 * gets it together with the user.
 */
export type RewardsSnapshot = {
	stamps: number;
	stampsPerReward: number;
	pendingStamps: number;
	availableRewards: number;
	lifetimeStamps: number;
	activeClaim: { claimId: Id<'rewardClaims'>; itemRef: string } | null;
	eligibleItems: string[];
	/** Set only while the account has stamps/rewards to lose — feed it to `expiryWarning()`
	 *  client-side, so the warning is computed against the viewer's clock at render time. */
	lastActivityAt: number | null;
	/** First-purchase discount echo — non-null only while the caller is still eligible. Display
	 *  only; checkout recomputes the amount server-side, never trusting it. */
	welcomeOffer: { discountPercent: number; maxDiscountMinorUnits: number | null } | null;
};
