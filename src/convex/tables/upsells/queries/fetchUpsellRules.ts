/**
 * Admin upsell list read (UpsellsSystemDesign.md §6.1). The admin page's ONE subscription
 * (display + mutation share the screen). Returns ALL rules (enabled + disabled) with per-item
 * and per-trigger health so the UI can badge problems ("ya no existe" / "no disponible")
 * without breaking the rule. Whole-set — the table is tens of rows by construction.
 *
 * Sorted the way the list renders and matching evaluates: enabled first, then by specificity
 * (product > category > global).
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// VALIDATORS
import { upsellAdminRuleValidator } from '../validators/upsellsValidators';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type {
	UpsellAdminItem,
	UpsellTrigger,
	UpsellTriggerStatus
} from '@/shared/features/upsells/types/upsellsTypes';

const SPECIFICITY: Record<UpsellTrigger['kind'], number> = { product: 3, category: 2, global: 1 };

/** 'boards-1-M' → 'Boards 1 M'. Fallback name for a ref/slug with no row (mirrors resolveRefs). */
function titleCase(ref: string): string {
	return ref
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve one offered ref to the admin shape, distinguishing missing vs merely unavailable. */
async function resolveAdminItem(
	ctx: QueryCtx,
	ref: string,
	productCache: Map<Id<'products'>, Doc<'products'> | null>
): Promise<UpsellAdminItem> {
	const variant = await ctx.db
		.query('productVariants')
		.withIndex('by_ref', (q) => q.eq('ref', ref))
		.unique();

	if (!variant) {
		return { ref, name: titleCase(ref), imageUrl: null, priceMinor: null, status: 'missing' };
	}

	let product = productCache.get(variant.productId);
	if (product === undefined) {
		product = await ctx.db.get(variant.productId);
		productCache.set(variant.productId, product);
	}

	const purchasable =
		product !== null &&
		product.status === 'active' &&
		variant.available &&
		variant.deletedAt === undefined;
	const baseName = product ? product.name : titleCase(ref);

	return {
		ref,
		name: variant.label ? `${baseName} · ${variant.label}` : baseName,
		imageUrl: product ? (product.images[0] ?? null) : null,
		// Show the price whenever the variant exists (informative for the admin); null only when gone.
		priceMinor: variant.priceMinor,
		status: purchasable ? 'ok' : 'unavailable'
	};
}

/** Resolve a trigger to a readable label + whether it still names something. */
async function resolveTrigger(
	ctx: QueryCtx,
	trigger: UpsellTrigger
): Promise<{ label: string; status: UpsellTriggerStatus }> {
	if (trigger.kind === 'global') return { label: '', status: 'ok' };

	if (trigger.kind === 'product') {
		const product = await ctx.db
			.query('products')
			.withIndex('by_slug', (q) => q.eq('slug', trigger.slug))
			.unique();
		return product ? { label: product.name, status: 'ok' } : { label: trigger.slug, status: 'missing' };
	}

	const category = await ctx.db
		.query('productCategories')
		.withIndex('by_slug', (q) => q.eq('slug', trigger.category))
		.unique();
	return category
		? { label: category.name, status: 'ok' }
		: { label: trigger.category, status: 'missing' };
}

export const fetchUpsellRules = query({
	args: {},
	returns: v.object({ rules: v.array(upsellAdminRuleValidator) }),
	handler: async (ctx) => {
		// Bounded by construction — one row per configured trigger.
		const rows = await ctx.db.query('upsells').collect();

		const productCache = new Map<Id<'products'>, Doc<'products'> | null>();
		const rules = [];
		for (const rule of rows) {
			const items: UpsellAdminItem[] = [];
			for (const ref of rule.itemRefs) {
				items.push(await resolveAdminItem(ctx, ref, productCache));
			}
			const { label, status } = await resolveTrigger(ctx, rule.trigger);
			rules.push({
				id: rule._id,
				trigger: rule.trigger,
				triggerLabel: label,
				triggerStatus: status,
				items,
				enabled: rule.enabled
			});
		}

		// Enabled first, then most-specific first — the order the list renders + matching uses.
		rules.sort((a, b) => {
			if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
			return SPECIFICITY[b.trigger.kind] - SPECIFICITY[a.trigger.kind];
		});

		return { rules };
	}
});
