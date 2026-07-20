// Runnable self-check for the first-purchase discount math (no test framework — the repo has none).
// Run: `bun src/shared/features/rewards/utils/rewardsUtils.check.ts`.
// Covers RewardSystem.md §15.10, first checklist item (welcomeDiscountMinor).

import assert from 'node:assert/strict';
import { welcomeDiscountMinor } from './rewardsUtils.ts';

// Basic percentage, uncapped: 10% of $120.00 (12000 minor) = $12.00 (1200 minor).
assert.equal(welcomeDiscountMinor(12000, 10, null), 1200);

// Floors to an integer minor unit: 10% of 1 minor = 0.1 → 0.
assert.equal(welcomeDiscountMinor(1, 10, null), 0);
// 15% of 199 minor = 29.85 → 29 (floor, never rounds up).
assert.equal(welcomeDiscountMinor(199, 15, null), 29);

// Cap bounds the amount: 10% of $1,000 (100000) = 10000, capped at 5000.
assert.equal(welcomeDiscountMinor(100000, 10, 5000), 5000);
// Cap above the raw amount is a no-op.
assert.equal(welcomeDiscountMinor(12000, 10, 999999), 1200);

// Feature off (null percent) → no discount.
assert.equal(welcomeDiscountMinor(12000, null, null), 0);
// Non-positive percent → no discount.
assert.equal(welcomeDiscountMinor(12000, 0, null), 0);
assert.equal(welcomeDiscountMinor(12000, -5, null), 0);
// Non-positive subtotal → no discount (empty/credit order).
assert.equal(welcomeDiscountMinor(0, 10, null), 0);
assert.equal(welcomeDiscountMinor(-500, 10, null), 0);

// Full 100% is allowed (a "first order free" campaign).
assert.equal(welcomeDiscountMinor(12000, 100, null), 12000);

console.log('rewardsUtils.check.ts: all assertions passed');
