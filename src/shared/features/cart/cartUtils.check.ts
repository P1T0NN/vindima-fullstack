// Runnable self-check for the pure cart logic (no test framework — the repo has none).
// Run: `bun src/shared/features/cart/cartUtils.check.ts` (or `node --experimental-strip-types`).
// cartUtils.ts imports nothing, so this runs standalone.

import assert from 'node:assert/strict';
import { clampQty, mergeLines, parseStoredCart, setLineQty, upsertLine } from './cartUtils.ts';

const MAX_QTY = 20;
const MAX_LINES = 3;
const line = (ref: string, qty: number, addedAt: number) => ({ productRef: ref, qty, addedAt });

// clampQty: hostile inputs → valid integer in [1, max]
assert.equal(clampQty(NaN, MAX_QTY), 1);
assert.equal(clampQty(-5, MAX_QTY), 1);
assert.equal(clampQty(999, MAX_QTY), MAX_QTY);
assert.equal(clampQty(3.9, MAX_QTY), 3);
assert.equal(clampQty(0, MAX_QTY, 0), 0);

// upsertLine: existing ref increments (clamped); new ref appends; overflow rejects
assert.deepEqual(upsertLine([line('a', 2, 1)], 'a', 3, 9, MAX_QTY, MAX_LINES), [line('a', 5, 1)]);
assert.equal(upsertLine([line('a', 19, 1)], 'a', 5, 9, MAX_QTY, MAX_LINES)[0].qty, MAX_QTY);
let overflowed = false;
const full = [line('a', 1, 1), line('b', 1, 2), line('c', 1, 3)];
assert.equal(upsertLine(full, 'd', 1, 9, MAX_QTY, MAX_LINES, () => (overflowed = true)).length, 3);
assert.equal(overflowed, true);

// setLineQty: 0 removes; positive sets clamped; unknown ref is a no-op
assert.deepEqual(setLineQty([line('a', 2, 1)], 'a', 0, MAX_QTY), []);
assert.equal(setLineQty([line('a', 2, 1)], 'a', 99, MAX_QTY)[0].qty, MAX_QTY);
assert.deepEqual(setLineQty([line('a', 2, 1)], 'z', 5, MAX_QTY), [line('a', 2, 1)]);

// mergeLines: union by ref, max(qty) not sum, earliest addedAt, sorted, truncated
const merged = mergeLines(
	[line('a', 2, 100)],
	[line('a', 3, 50), line('b', 1, 200)],
	MAX_QTY,
	MAX_LINES
);
assert.deepEqual(merged, [line('a', 3, 50), line('b', 1, 200)]); // max(2,3)=3, min(100,50)=50
// idempotent: merging the result with the guest lines again changes nothing
assert.deepEqual(
	mergeLines(merged, [line('a', 3, 50), line('b', 1, 200)], MAX_QTY, MAX_LINES),
	merged
);
// truncation keeps server lines first, then guest by addedAt
const trunc = mergeLines(
	[line('s1', 1, 1), line('s2', 1, 2), line('s3', 1, 3)],
	[line('g1', 1, 4)],
	MAX_QTY,
	MAX_LINES
);
assert.equal(trunc.length, MAX_LINES);
assert.ok(!trunc.some((l) => l.productRef === 'g1'));

// parseStoredCart: valid parses; corrupt/legacy/missing → [] (never throws)
assert.deepEqual(parseStoredCart(JSON.stringify({ lines: [line('a', 2, 1)] })), [line('a', 2, 1)]);
assert.deepEqual(parseStoredCart('not json'), []);
assert.deepEqual(parseStoredCart(null), []);
assert.deepEqual(parseStoredCart(JSON.stringify({ lines: 'nope' })), []);
assert.deepEqual(parseStoredCart(JSON.stringify({ lines: [{ productRef: 'a' }] })), []); // bad shape dropped

console.log('cartUtils self-check passed ✓');
