// LIBRARIES
import { v } from 'convex/values';

/**
 * What fires an upsell rule (UpsellsSystemDesign.md §4.1). Specificity order, most wins:
 * `product` > `category` > `global`. Triggers store the same opaque catalog strings the rest
 * of the system stores — a product `slug`, a category slug — never a product schema import.
 */
export const upsellTriggerValidator = v.union(
	/** One specific product (any of its variants) — `products.slug`, verbatim. */
	v.object({ kind: v.literal('product'), slug: v.string() }),
	/** Any product in one category — the opaque category slug, verbatim. */
	v.object({ kind: v.literal('category'), category: v.string() }),
	/** Any add at all — the store-wide fallback rule. */
	v.object({ kind: v.literal('global') })
);

// ─── Shop-side catalog (fetchUpsellCatalog) ──────────────────────────────────

/** A resolved, live offer item — dead refs are dropped, so price is never null here. */
export const upsellCatalogItemValidator = v.object({
	ref: v.string(),
	name: v.string(),
	description: v.union(v.string(), v.null()),
	imageUrl: v.union(v.string(), v.null()),
	priceMinor: v.number()
});

export const upsellCatalogRuleValidator = v.object({
	id: v.id('upsells'),
	trigger: upsellTriggerValidator,
	items: v.array(upsellCatalogItemValidator)
});

// ─── Admin list (fetchUpsellRules) ───────────────────────────────────────────

/** Per-item health so the list can badge problems without breaking the rule. */
export const upsellAdminItemValidator = v.object({
	ref: v.string(),
	name: v.string(),
	imageUrl: v.union(v.string(), v.null()),
	priceMinor: v.union(v.number(), v.null()),
	status: v.union(v.literal('ok'), v.literal('missing'), v.literal('unavailable'))
});

export const upsellAdminRuleValidator = v.object({
	id: v.id('upsells'),
	trigger: upsellTriggerValidator,
	triggerLabel: v.string(),
	triggerStatus: v.union(v.literal('ok'), v.literal('missing')),
	items: v.array(upsellAdminItemValidator),
	enabled: v.boolean()
});
