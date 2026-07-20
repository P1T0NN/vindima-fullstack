/**
 * Create a product + its variants in one transaction (ProductsTableSystemDesign.md §6).
 *
 * Validates: non-empty name, ≥ 1 variant, non-negative integer prices, slug unique (`by_slug`),
 * every ref unique (`by_ref`, and within the payload). Created as `draft` (admin publishes it
 * later); `wasActive` starts false so it stays hard-deletable until first activation.
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { isValidPrice, variantInput } from '../productsValidators';
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

// HELPERS
import { resolveImageUrls } from '../helpers/resolveImageUrls';

/** Trim; empty → undefined. Lets the admin form pass raw values straight through. */
const clean = (s: string | undefined | null): string | undefined => {
	const t = s?.trim();
	return t ? t : undefined;
};

export const createProduct = adminMutation('createProduct')({
	args: {
		slug: v.string(),
		name: v.string(),
		description: v.optional(v.string()),
		/** Uploaded-file references (storage ids / R2 keys) or direct paths/URLs. `[0]` = cover. */
		images: v.array(v.string()),
		category: v.string(),
		featured: v.optional(v.boolean()),
		sortOrder: v.number(),
		variants: v.array(variantInput)
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Clean raw form values (trim; '' → absent) then validate — all soft failures, nothing
		// written yet.
		const name = clean(args.name);
		const description = clean(args.description);
		const images = await resolveImageUrls(ctx, args.images);

		if (!name) return fail('NAME_REQUIRED');
		if (args.variants.length === 0) return fail('VARIANT_REQUIRED');

		// Runtime category safety (ProductCategorySystemDesign.md §5): the slug must exist in
		// `productCategories` — even a scripted caller bypassing the UI can't write a typo.
		const categoryRow = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', args.category))
			.unique();
		if (!categoryRow) return fail('CATEGORY_INVALID');

		const cleanedVariants = args.variants.map((variant) => ({
			...variant,
			label: clean(variant.label)
		}));

		const seen = new Set<string>();
		for (const variant of cleanedVariants) {
			if (!isValidPrice(variant.priceMinor)) return fail('INVALID_PRICE');
			if (seen.has(variant.ref)) return fail('REF_TAKEN');
			seen.add(variant.ref);
		}

		// Uniqueness against the DB (OCC serializes concurrent duplicate creates).
		const slugTaken = await ctx.db
			.query('products')
			.withIndex('by_slug', (q) => q.eq('slug', args.slug))
			.unique();
		if (slugTaken) return fail('SLUG_TAKEN');

		for (const variant of cleanedVariants) {
			const refTaken = await ctx.db
				.query('productVariants')
				.withIndex('by_ref', (q) => q.eq('ref', variant.ref))
				.unique();
			if (refTaken) return fail('REF_TAKEN');
		}

		// Ordering is auto-assigned, never typed by the admin: a new product is appended to the end
		// of its category (highest existing sortOrder + 1). `args.sortOrder` is ignored.
		const categoryProducts = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', args.category))
			.collect();
		const productSortOrder =
			categoryProducts.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;

		const productId = await ctx.db.insert('products', {
			slug: args.slug,
			name,
			description,
			images,
			category: args.category,
			status: 'draft',
			featured: args.featured,
			wasActive: false,
			sortOrder: productSortOrder
		});

		// Variant order = the order the admin listed them in the form (top to bottom).
		let variantSortOrder = 0;
		for (const variant of cleanedVariants) {
			await ctx.db.insert('productVariants', {
				productId,
				ref: variant.ref,
				label: variant.label,
				priceMinor: variant.priceMinor,
				available: variant.available,
				sortOrder: variantSortOrder++
			});
		}

		ctx.audit(AUDIT_ACTIONS.PRODUCT_CREATE, {
			resource: { table: 'products', id: productId },
			after: { slug: args.slug, category: args.category, variantCount: cleanedVariants.length }
		});

		return { success: true, message: { key: 'ProductMessages.PRODUCT_CREATED' } };
	}
});

function fail(key: string): ConvexMutationResult {
	return { success: false, message: { key: `ProductMessages.${key}` } };
}
