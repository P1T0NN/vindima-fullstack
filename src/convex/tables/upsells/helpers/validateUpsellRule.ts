/**
 * Shared create/edit validation for upsell rules (UpsellsSystemDesign.md §6.2) — the same
 * discipline reward items use: never let the owner configure a dead offer or a trigger that
 * names nothing. A plain helper (not a registered function), reusing the cart's `resolveRefs`
 * so "sellable" means exactly what checkout means.
 */

// CONFIG
import { UPSELLS_CONFIG } from '@/shared/config';

// HELPERS
import { resolveRefs } from '@/convex/tables/cart/helpers/resolveRefs';

// UTILS
import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { UpsellTrigger } from '@/shared/features/upsells/types/upsellsTypes';

type ValidationOk = { ok: true; triggerKey: string };
type ValidationFail = { ok: false; key: string };

/**
 * Validate a rule's trigger + items. Returns the canonical `triggerKey` on success (the caller
 * uses it for the uniqueness check + insert), or a translatable message key on failure.
 */
export async function validateUpsellRule(
	ctx: MutationCtx,
	trigger: UpsellTrigger,
	itemRefs: string[]
): Promise<ValidationOk | ValidationFail> {
	// Item count + no duplicates (zod already bounds this; re-checked authoritatively here).
	if (itemRefs.length === 0 || itemRefs.length > UPSELLS_CONFIG.MAX_ITEMS_PER_RULE) {
		return { ok: false, key: 'UpsellsMessages.INVALID_ITEMS' };
	}
	if (new Set(itemRefs).size !== itemRefs.length) {
		return { ok: false, key: 'UpsellsMessages.INVALID_ITEMS' };
	}

	// Every offered ref must resolve to a live, sellable variant — never offer a dead item.
	const resolved = await resolveRefs(ctx, itemRefs);
	if (resolved.some((r) => r.unitPriceMinor === null)) {
		return { ok: false, key: 'UpsellsMessages.INVALID_ITEMS' };
	}

	// Product/category triggers must name something that exists; `global` always does.
	if (trigger.kind === 'product') {
		const product = await ctx.db
			.query('products')
			.withIndex('by_slug', (q) => q.eq('slug', trigger.slug))
			.unique();
		if (!product) return { ok: false, key: 'UpsellsMessages.INVALID_TRIGGER' };

		// A product can't upsell itself — none of the offered refs may be its own variants.
		const ownVariants = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', product._id))
			.collect();
		const ownRefs = new Set(ownVariants.map((v) => v.ref));
		if (itemRefs.some((ref) => ownRefs.has(ref))) {
			return { ok: false, key: 'UpsellsMessages.INVALID_ITEMS' };
		}
	} else if (trigger.kind === 'category') {
		const category = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', trigger.category))
			.unique();
		if (!category) return { ok: false, key: 'UpsellsMessages.INVALID_TRIGGER' };
	}

	return { ok: true, triggerKey: buildTriggerKey(trigger) };
}
