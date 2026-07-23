// Runnable self-check for the pure upsell logic (no test framework — the repo has none).
// Run: `bun src/shared/features/upsells/utils/upsellsUtils.check.ts`.
// Covers UpsellsSystemDesign.md §13 (triggerKey shape, specificity, filters, cap).

import assert from 'node:assert/strict';
import { buildTriggerKey, matchUpsellRule, visibleUpsellItems } from './upsellsUtils.ts';
import type { UpsellCatalogRule } from '../types/upsellsTypes.ts';

// ── triggerKey shape (uniqueness key stored on every row) ──
assert.equal(buildTriggerKey({ kind: 'product', slug: 'boards-1' }), 'product:boards-1');
assert.equal(buildTriggerKey({ kind: 'category', category: 'tapas' }), 'category:tapas');
assert.equal(buildTriggerKey({ kind: 'global' }), 'global');

const item = (ref: string): UpsellCatalogRule['items'][number] => ({
	ref,
	name: ref,
	description: null,
	imageUrl: null,
	priceMinor: 1000
});
const rule = (id: string, trigger: UpsellCatalogRule['trigger'], refs: string[]): UpsellCatalogRule => ({
	id,
	trigger,
	items: refs.map(item)
});

const productRule = rule('p', { kind: 'product', slug: 'reserva' }, ['cheese']);
const categoryRule = rule('c', { kind: 'category', category: 'wines' }, ['olives']);
const globalRule = rule('g', { kind: 'global' }, ['bread']);
const all = [globalRule, categoryRule, productRule]; // deliberately unsorted

// ── specificity: product > category > global, only the most specific fires ──
// (`name` is display-only, irrelevant to matching — a placeholder keeps the type happy.)
const added = (slug: string, category: string) => ({ slug, category, name: '' });
assert.equal(matchUpsellRule(added('reserva', 'wines'), all)?.id, 'p');
assert.equal(matchUpsellRule(added('blanco', 'wines'), all)?.id, 'c');
assert.equal(matchUpsellRule(added('blanco', 'tapas'), all)?.id, 'g');
// No rules at all → null (sidebar opens as before the feature existed).
assert.equal(matchUpsellRule(added('x', 'y'), []), null);
// Only a product rule, non-matching product → null (no fallback to less specific that doesn't exist).
assert.equal(matchUpsellRule(added('other', 'z'), [productRule]), null);

// ── visibleUpsellItems: drop just-added + already-in-cart, keep order, cap ──
const wide = rule('w', { kind: 'global' }, ['a', 'b', 'c', 'd', 'e']);
assert.deepEqual(
	visibleUpsellItems(wide, [], 'a', 4).map((i) => i.ref),
	['b', 'c', 'd', 'e']
); // just-added 'a' dropped
assert.deepEqual(
	visibleUpsellItems(wide, ['b', 'c'], 'a', 4).map((i) => i.ref),
	['d', 'e']
); // in-cart b,c dropped
assert.equal(visibleUpsellItems(wide, [], 'z', 2).length, 2); // capped at max
assert.equal(visibleUpsellItems(wide, ['a', 'b', 'c', 'd', 'e'], 'z', 4).length, 0); // all in cart → empty

console.log('upsellsUtils.check.ts: all assertions passed');
