/**
 * Create a product + its variants in one transaction (ProductsTableSystemDesign.md §6).
 *
 * Input validation is the SHARED `createProductSchema`
 * (`@/shared/features/products/schemas/productsSchemas`) — the same schema the admin form
 * runs pre-submit. Args are derived from it (`zodToConvexFields`), and the handler re-runs
 * it authoritatively; a failure returns a generic soft-fail envelope (no per-issue
 * messages for now). Only DB-dependent rules live here:
 * slug unique (`by_slug`), every ref unique (`by_ref`), category exists. Created as `draft`
 * (admin publishes later); `wasActive` starts false so it stays hard-deletable until first
 * activation.
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { createProductSchema } from '@/shared/features/products/schemas/productsSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/validationUtils';

// HELPERS
import { resolveImageUrls } from '../helpers/resolveImageUrls';

// TYPES
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const createProduct = adminMutation('createProduct')({
	args: zodToConvexFields(createProductSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		// No per-issue messages for now — a schema failure returns a generic envelope key.
		const parsed = createProductSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}

		// Post-parse cleanup: `name` is already trimmed by the schema; '' → absent for the rest.
		const { slug, category, name, featured } = parsed.data;
		const description = trimToUndefined(parsed.data.description);
		const images = await resolveImageUrls(ctx, parsed.data.images);
		const cleanedVariants = parsed.data.variants.map((variant) => ({
			...variant,
			label: trimToUndefined(variant.label)
		}));

		// Runtime category safety (ProductCategorySystemDesign.md §5): the slug must exist in
		// `productCategories` — even a scripted caller bypassing the UI can't write a typo.
		const categoryRow = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', category))
			.unique();
		if (!categoryRow) return fail('CATEGORY_INVALID');

		// Uniqueness against the DB (OCC serializes concurrent duplicate creates).
		const slugTaken = await ctx.db
			.query('products')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
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
		// of its category (highest existing sortOrder + 1).
		const categoryProducts = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category))
			.collect();
		const productSortOrder =
			categoryProducts.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;

		const productId = await ctx.db.insert('products', {
			slug,
			name,
			description,
			images,
			category,
			status: 'draft',
			featured,
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
			after: { slug, category, variantCount: cleanedVariants.length }
		});

		return { success: true, message: { key: 'ProductMessages.PRODUCT_CREATED' } };
	}
});

function fail(key: string): ConvexMutationResult {
	return { success: false, message: { key: `ProductMessages.${key}` } };
}
