// CONFIG
import { REWARDS_CONFIG } from '@/shared/config.js';

/**
 * Pure punch-card math. No Convex ctx, no I/O — every function is a total function
 * of its inputs (and `REWARDS_CONFIG`), so the whole file is trivially testable and
 * reused identically by mutations and the confirm/expiry crons. All counters are
 * integers; there is no float arithmetic anywhere in the rewards module.
 *
 * See `RewardSystem.md` for the model. The mutations own the ledger writes and the
 * denormalized `rewardAccounts` row; this file only computes the new counter values.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Denormalized card counters, as stored on a `rewardAccounts` row. */
export type RewardCounters = {
	stamps: number;
	availableRewards: number;
	lifetimeStamps: number;
};

/** Does an order subtotal qualify for a stamp? (`0` threshold ⇒ every order qualifies.) */
export function qualifiesForStamp(subtotalMinorUnits: number): boolean {
	return subtotalMinorUnits >= REWARDS_CONFIG.EARN.MIN_ORDER_MINOR_UNITS;
}


/**
 * Add one confirmed stamp and fold any completed card(s) into banked rewards.
 * `rewardsEarned` is normally 0 or 1; it can be >1 only if `STAMPS_PER_REWARD` was
 * lowered below a user's current progress, which this `Math.floor` drains in one step
 * (spec §9 "STAMPS_PER_REWARD changed after launch"). Returns the *new* counters.
 */
export function confirmStamp(c: RewardCounters): RewardCounters & { rewardsEarned: number } {
	const per = REWARDS_CONFIG.STAMPS_PER_REWARD;
	const total = c.stamps + 1;
	const rewardsEarned = Math.floor(total / per);
	return {
		stamps: total % per,
		availableRewards: c.availableRewards + rewardsEarned,
		lifetimeStamps: c.lifetimeStamps + 1,
		rewardsEarned
	};
}

/**
 * Normalize raw card counters after a bulk change (admin `adjust`, or ledger replay in
 * `rebuildAccount`): fold every completed card into `availableRewards` and keep `stamps`
 * in `[0, per)`. Works for negatives too — a stamp deficit borrows from rewards, the same
 * "honest debt" rule refunds use (spec §9). `Math.floor` handles both directions in one step.
 */
export function foldCompletedCards(
	stamps: number,
	availableRewards: number
): { stamps: number; availableRewards: number } {
	const per = REWARDS_CONFIG.STAMPS_PER_REWARD;
	const earned = Math.floor(stamps / per);
	return { stamps: stamps - earned * per, availableRewards: availableRewards + earned };
}

/**
 * Inverse of a single confirmed stamp (refund of a completed order). If the card has
 * progress, drop one stamp. If it's at 0, the reversed stamp was the one that completed
 * the previous card, so borrow it back: `availableRewards - 1` (may go negative if that
 * reward was already claimed — honest debt, spec §9) and reset progress to `per - 1`.
 *
 * ponytail: mirrors one stamp, not the rare multi-reward config-shrink fold in
 * `confirmStamp`. Revoke always targets one specific order's one stamp, so one-at-a-time
 * is correct; `rebuildAccount` is the escape hatch if counters ever drift.
 */
export function revokeConfirmedStamp(c: RewardCounters): RewardCounters {
	if (c.stamps > 0) {
		return {
			stamps: c.stamps - 1,
			availableRewards: c.availableRewards,
			lifetimeStamps: c.lifetimeStamps - 1
		};
	}
	return {
		stamps: REWARDS_CONFIG.STAMPS_PER_REWARD - 1,
		availableRewards: c.availableRewards - 1,
		lifetimeStamps: c.lifetimeStamps - 1
	};
}

/** Stable reasons a reward claim can be blocked. The frontend maps each to copy. */
export type ClaimBlockedReason =
	| 'ITEM_NOT_ELIGIBLE'
	| 'NO_REWARDS_AVAILABLE'
	| 'ACTIVE_CLAIM_EXISTS';

/**
 * Guard for `claimReward`. Returns a stable reason code, or `null` if the claim is
 * allowed. Pure and code-based (not a sentence) so the wording lives on the frontend in
 * `rewardsCopy.ts` and the check stays unit-testable. Eligibility is an INPUT — the
 * server computes it from the DB (`rewardEligible` flag, RewardItemsSystemDesign.md §4.3),
 * keeping this function free of I/O and config.
 */
export function claimBlockedReason(opts: {
	isEligible: boolean;
	availableRewards: number;
	hasActiveClaim: boolean;
}): ClaimBlockedReason | null {
	if (!opts.isEligible) return 'ITEM_NOT_ELIGIBLE';
	if (opts.availableRewards < 1) return 'NO_REWARDS_AVAILABLE';
	if (opts.hasActiveClaim) return 'ACTIVE_CLAIM_EXISTS';
	return null;
}

/**
 * ms epoch at which an inactive account's card + banked rewards expire, or `null` if
 * expiry is disabled. Uses calendar months (via `Date`, deterministic — takes a ms input,
 * never `Date.now()`), so "12 months" respects month lengths.
 */
export function expiresAt(lastActivityAt: number): number | null {
	const months = REWARDS_CONFIG.EXPIRY.INACTIVITY_MONTHS;
	if (months === null) return null;
	const d = new Date(lastActivityAt);
	d.setMonth(d.getMonth() + months);
	return d.getTime();
}

/** True once an account has passed its expiry moment (drives the expire cron). */
export function isExpired(lastActivityAt: number, now: number): boolean {
	const exp = expiresAt(lastActivityAt);
	return exp !== null && now >= exp;
}

/**
 * The pre-expiry warning shown by `fetchMyRewards`: non-null only inside the
 * `WARN_DAYS_BEFORE` window and before the account has actually expired. Caller decides
 * whether there's anything worth warning about (stamps/rewards > 0).
 */
export function expiryWarning(lastActivityAt: number, now: number): { expiresAt: number } | null {
	const exp = expiresAt(lastActivityAt);
	if (exp === null) return null;
	const warnFrom = exp - REWARDS_CONFIG.EXPIRY.WARN_DAYS_BEFORE * DAY_MS;
	return now >= warnFrom && now < exp ? { expiresAt: exp } : null;
}

/** ms a fresh stamp stays pending, or `0` for instant confirmation. */
export function pendingWindowMs(): number {
	return REWARDS_CONFIG.EARN.PENDING_DAYS * DAY_MS;
}

/**
 * First-purchase discount amount (see RewardSystem.md §15.4). Integer minor units only.
 * Returns `0` (no discount) for a null/non-positive percent or a non-positive subtotal, so
 * callers never branch — a `0` discount line is simply not applied. `Math.floor` keeps the
 * result an integer; `capMinorUnits` bounds "10% of a huge order" when set.
 *
 * Pure: eligibility (never purchased, verified email, feature on) is decided by
 * `getWelcomeOfferEligibility` server-side; this only prices an already-eligible order.
 */
export function welcomeDiscountMinor(
	subtotalMinorUnits: number,
	percent: number | null,
	capMinorUnits: number | null
): number {
	if (percent === null || percent <= 0 || subtotalMinorUnits <= 0) return 0;
	const raw = Math.floor((subtotalMinorUnits * percent) / 100);
	return capMinorUnits === null ? raw : Math.min(raw, capMinorUnits);
}
