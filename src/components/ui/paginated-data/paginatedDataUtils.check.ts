// Runnable self-check for the page-number window (no test framework — the repo has none).
// Run: `bun src/components/ui/paginated-data/paginatedDataUtils.check.ts`.
// Elision is fiddly off-by-one logic that renders straight into navigation, so it gets a check.

import assert from 'node:assert/strict';
import { pageWindow } from './paginatedDataUtils.ts';

assert.deepEqual(pageWindow(1, 0), [], 'no pages');
assert.deepEqual(pageWindow(1, 1), [1], 'single page');
assert.deepEqual(pageWindow(3, 5), [1, 2, 3, 4, 5], 'contiguous — no gaps');
assert.deepEqual(pageWindow(1, 5), [1, 2, 'gap', 5], 'first page elides the tail');
assert.deepEqual(pageWindow(10, 10), [1, 'gap', 9, 10], 'last page elides the head');
assert.deepEqual(pageWindow(5, 10), [1, 'gap', 4, 5, 6, 'gap', 10], 'middle elides both sides');
assert.deepEqual(pageWindow(99, 5), [1, 'gap', 4, 5], 'out-of-range current clamps to total');
assert.deepEqual(pageWindow(5, 10, 2), [1, 'gap', 3, 4, 5, 6, 7, 'gap', 10], 'wider span');

// The first and last page are always reachable, from any position — that is what makes a
// numbered paginator crawlable.
for (const current of [1, 2, 7, 50, 100]) {
	const slots = pageWindow(current, 100);
	assert.equal(slots[0], 1, `page ${current}: first page present`);
	assert.equal(slots.at(-1), 100, `page ${current}: last page present`);
}

console.log('paginatedDataUtils.check.ts: all assertions passed');
