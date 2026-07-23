/**
 * Pure upsell logic (UpsellsSystemDesign.md §5), runtime-agnostic — imported by the Convex
 * mutations (`buildTriggerKey`) and by the shop client (`matchUpsellRule`, `visibleUpsellItems`).
 * No I/O, no Convex, no Svelte: matching a rule to an add is a synchronous computation so the
 * dialog can open with zero latency.
 */

// TYPES
import type {
	AddedProduct,
	UpsellCatalogItem,
	UpsellCatalogRule,
	UpsellTrigger
} from '../types/upsellsTypes';

/** Canonical unique key for a trigger — stored as `triggerKey` (uniqueness + O(1) lookup). */
export function buildTriggerKey(trigger: UpsellTrigger): string {
	switch (trigger.kind) {
		case 'product':
			return `product:${trigger.slug}`;
		case 'category':
			return `category:${trigger.category}`;
		case 'global':
			return 'global';
	}
}

/** Higher = more specific. The entire matching algorithm: product > category > global. */
const SPECIFICITY: Record<UpsellTrigger['kind'], number> = { product: 3, category: 2, global: 1 };

/** The single most specific rule matching the added product, or `null` if none match. */
export function matchUpsellRule(
	added: AddedProduct,
	rules: UpsellCatalogRule[]
): UpsellCatalogRule | null {
	let best: UpsellCatalogRule | null = null;
	let bestRank = 0;
	for (const rule of rules) {
		const t = rule.trigger;
		const matches =
			(t.kind === 'product' && t.slug === added.slug) ||
			(t.kind === 'category' && t.category === added.category) ||
			t.kind === 'global';
		if (!matches) continue;
		const rank = SPECIFICITY[t.kind];
		if (rank > bestRank) {
			best = rule;
			bestRank = rank;
		}
	}
	return best;
}

/**
 * Items the dialog should actually show: drop the just-added ref and anything already in the
 * cart (suggesting what they have is noise), keep the owner's order, cap at `max`. Catalog items
 * are already live/priced server-side, so there's no availability filter to repeat here.
 */
export function visibleUpsellItems(
	rule: UpsellCatalogRule,
	cartRefs: Iterable<string>,
	addedRef: string,
	max: number
): UpsellCatalogItem[] {
	const inCart = new Set(cartRefs);
	const out: UpsellCatalogItem[] = [];
	for (const item of rule.items) {
		if (item.ref === addedRef || inCart.has(item.ref)) continue;
		out.push(item);
		if (out.length >= max) break;
	}
	return out;
}
