// Runnable self-check for order-number parsing (no test framework — the repo has none).
// Run: `bun src/shared/features/orders/utils/orderNumber.check.ts`.
// This is user-typed input on a public lookup, so the accept/reject boundary matters.

import assert from 'node:assert/strict';
import { normalizeOrderNumber } from './orderNumber.ts';

const CANON = 'ORD-8B66KY';

// The exact form, as printed.
assert.equal(normalizeOrderNumber('ORD-8B66KY'), CANON);
// Every way a human retypes it.
assert.equal(normalizeOrderNumber('ord-8b66ky'), CANON);
assert.equal(normalizeOrderNumber('  ORD-8B66KY  '), CANON);
assert.equal(normalizeOrderNumber('ORD 8B66KY'), CANON);
assert.equal(normalizeOrderNumber('ORD8B66KY'), CANON);
// Body only — plenty of people drop the prefix.
assert.equal(normalizeOrderNumber('8B66KY'), CANON);
assert.equal(normalizeOrderNumber('8b66ky'), CANON);

// Rejections: anything that cannot be a real number never reaches the database.
assert.equal(normalizeOrderNumber(''), '');
assert.equal(normalizeOrderNumber('ORD-'), '');
assert.equal(normalizeOrderNumber('8B66K'), ''); // too short
assert.equal(normalizeOrderNumber('8B66KYZ'), ''); // too long
assert.equal(normalizeOrderNumber('ORD-8B66K!'), ''); // punctuation is stripped, then too short
assert.equal(normalizeOrderNumber('mi pedido'), '');

// A body that legitimately starts with the letters ORD is not mistaken for a prefix, because
// the prefix strip only runs once against the head of the cleaned string.
assert.equal(normalizeOrderNumber('ORD-ORD123'), 'ORD-ORD123');

console.log('orderNumber.check.ts: all assertions passed');
