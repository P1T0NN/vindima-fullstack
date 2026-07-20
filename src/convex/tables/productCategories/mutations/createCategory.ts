/**
 * Create a product category (ProductCategorySystemDesign.md §5).
 *
 * The owner types a display name only; the slug — THE string `products.category` stores —
 * is derived here once (lowercase kebab-case) and is immutable thereafter. Uniqueness is
 * enforced on the slug (`by_slug`; OCC serializes concurrent duplicate creates), so two
 * names that slugify identically ("Boards" / "boards!") collide by design — they'd be the
 * same grouping key. `sortOrder` is auto-assigned (append), same convention as products.
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { createCategorySchema } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

// UTILS
import { slugify } from '@/shared/utils/stringUtils';

export const createCategory = adminMutation('createCategory')({
	args: zodToConvexFields(createCategorySchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (name non-empty after trim).
		const parsed = createCategorySchema.safeParse(args);
		if (!parsed.success) return fail('CATEGORY_NAME_REQUIRED');
		const name = parsed.data.name;

		// Non-Latin names can slugify to nothing — treated as a missing name in v1 (§8).
		const slug = slugify(name);
		if (!slug) return fail('CATEGORY_NAME_REQUIRED');

		const taken = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.unique();
		if (taken) return fail('CATEGORY_TAKEN');

		// Append to the end of the picker, same auto-assign convention as createProduct.
		const all = await ctx.db.query('productCategories').collect();
		const sortOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

		const categoryId = await ctx.db.insert('productCategories', { slug, name, sortOrder });

		ctx.audit(AUDIT_ACTIONS.CATEGORY_CREATE, {
			resource: { table: 'productCategories', id: categoryId },
			after: { slug, name }
		});

		return { success: true, message: { key: 'ProductMessages.CATEGORY_CREATED' } };
	}
});

function fail(key: string): ConvexMutationResult {
	return { success: false, message: { key: `ProductMessages.${key}` } };
}
