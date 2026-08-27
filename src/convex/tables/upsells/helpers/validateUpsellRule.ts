/**
 * Shared create/edit validation for upsell rules (UpsellsSystemDesign.md §6.2) — the same
 * discipline reward items use: never let the owner configure a dead offer or a trigger that
 * names nothing. A plain helper (not a registered function), reusing the cart's `resolveRefs`
 * so "sellable" means exactly what checkout means.
 */

// CONFIG
import { UPSELLS_CONFIG } from '@/shared/features/upsells/config';

// HELPERS
import { resolveRefs } from '@/convex/tables/cart/helpers/resolveRefs';

// UTILS
import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { UpsellTrigger } from '@/shared/features/upsells/types/upsellsTypes';

type ValidationOk = { ok: true; triggerKey: string };
type ValidationFail = { ok: false; message: string };

/**
 * Validate a rule's trigger + items. Returns the canonical `triggerKey` on success (the caller
 * uses it for the uniqueness check + insert), or display-ready text on failure.
 */
export async function validateUpsellRule(
	ctx: MutationCtx,
	trigger: UpsellTrigger,
	itemRefs: string[]
): Promise<ValidationOk | ValidationFail> {
	// Item count + no duplicates (zod already bounds this; re-checked authoritatively here).
	if (itemRefs.length === 0 || itemRefs.length > UPSELLS_CONFIG.MAX_ITEMS_PER_RULE) {
		return { ok: false, message: 'Revisa los artículos sugeridos: algunos ya no están disponibles.' };
	}
	if (new Set(itemRefs).size !== itemRefs.length) {
		return { ok: false, message: 'Revisa los artículos sugeridos: algunos ya no están disponibles.' };
	}

	// Every offered ref must resolve to a live, sellable variant — never offer a dead item.
	const resolved = await resolveRefs(ctx, itemRefs);
	if (resolved.some((r) => r.unitPriceMinor === null)) {
		return { ok: false, message: 'Revisa los artículos sugeridos: algunos ya no están disponibles.' };
	}

	// Product/category triggers must name something that exists; `global` always does.
	if (trigger.kind === 'product') {
		const product = await ctx.db
			.query('products')
			.withIndex('by_slug', (q) => q.eq('slug', trigger.slug))
			.unique();
		if (!product) return { ok: false, message: 'Ese disparador ya no está disponible.' };

		// A product can't upsell itself — none of the offered refs may be its own variants.
		const ownVariants = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', product._id))
			.collect();
		const ownRefs = new Set(ownVariants.map((v) => v.ref));
		if (itemRefs.some((ref) => ownRefs.has(ref))) {
			return { ok: false, message: 'Revisa los artículos sugeridos: algunos ya no están disponibles.' };
		}
	} else if (trigger.kind === 'category') {
		const category = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', trigger.category))
			.unique();
		if (!category) return { ok: false, message: 'Ese disparador ya no está disponible.' };
	}

	return { ok: true, triggerKey: buildTriggerKey(trigger) };
}
