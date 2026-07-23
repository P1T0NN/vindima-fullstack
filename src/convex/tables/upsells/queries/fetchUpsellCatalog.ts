/**
 * Public shop-side upsell read (UpsellsSystemDesign.md §6.1). One-shot, streamed with the shop
 * page — NO subscription (rules change only when an admin edits them elsewhere; see
 * GeneralSystemDesignRule.md). Returns every ENABLED rule with its items resolved to display
 * shape, dead refs dropped and now-empty rules omitted. Minimal projection: no admin fields.
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// CONFIG
import { FEATURES } from '@/shared/config';

// HELPERS
import { resolveRefs } from '@/convex/tables/cart/helpers/resolveRefs';

// VALIDATORS
import { upsellCatalogRuleValidator } from '../validators/upsellsValidators';

// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

export const fetchUpsellCatalog = query({
	args: {},
	returns: v.object({ rules: v.array(upsellCatalogRuleValidator) }),
	handler: async (ctx) => {
		if (!FEATURES.UPSELLS) return { rules: [] };

		// Bounded by construction — one row per configured trigger (tens, not thousands).
		const rows = await ctx.db.query('upsells').collect();
		const enabled = rows.filter((r) => r.enabled);
		if (enabled.length === 0) return { rules: [] };

		// Resolve every distinct offered ref once (name/image/price/sellability — the canonical
		// `resolveRefs` truth), then fan back out per rule.
		const distinctRefs = [...new Set(enabled.flatMap((r) => r.itemRefs))];
		const resolved = await resolveRefs(ctx, distinctRefs);
		const byRef = new Map(resolved.map((r) => [r.productRef, r]));

		// Product description isn't part of the cart resolution shape — fetch it for the live refs
		// (the dialog shows one line under each name). Products cached so shared refs read once.
		const productCache = new Map<Id<'products'>, Doc<'products'> | null>();
		const descByRef = new Map<string, string | null>();
		for (const r of resolved) {
			if (r.unitPriceMinor === null) continue;
			const variant = await ctx.db
				.query('productVariants')
				.withIndex('by_ref', (q) => q.eq('ref', r.productRef))
				.unique();
			if (!variant) continue;
			let product = productCache.get(variant.productId);
			if (product === undefined) {
				product = await ctx.db.get(variant.productId);
				productCache.set(variant.productId, product);
			}
			descByRef.set(r.productRef, product?.description ?? null);
		}

		const rules = [];
		for (const rule of enabled) {
			const items = [];
			for (const ref of rule.itemRefs) {
				const r = byRef.get(ref);
				if (!r || r.unitPriceMinor === null) continue; // drop archived/deleted/unavailable
				items.push({
					ref,
					name: r.name,
					description: descByRef.get(ref) ?? null,
					imageUrl: r.imageUrl,
					priceMinor: r.unitPriceMinor
				});
			}
			if (items.length === 0) continue; // a rule with no live items never opens a dialog
			rules.push({ id: rule._id, trigger: rule.trigger, items });
		}

		return { rules };
	}
});
