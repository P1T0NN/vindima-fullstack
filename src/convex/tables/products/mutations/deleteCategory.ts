/**
 * Delete a category (ProductCategorySystemDesign.md §5).
 *
 * Guarded: refused while ANY product (any status) still references the slug — a delete can
 * never orphan products; the owner moves or deletes them first. An empty category hard-
 * deletes (categories are never snapshotted anywhere, so hard delete is safe — unlike
 * products).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const deleteCategory = adminMutation('deleteCategory')({
	args: { categoryId: v.id('productCategories') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NOT_FOUND' } };
		}

		// In-use guard — one indexed row is enough to refuse.
		const inUse = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category.slug))
			.first();
		if (inUse) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_IN_USE' } };
		}

		await ctx.db.delete(args.categoryId);

		ctx.audit(AUDIT_ACTIONS.CATEGORY_DELETE, {
			resource: { table: 'productCategories', id: args.categoryId },
			before: { slug: category.slug, name: category.name }
		});

		return { success: true, message: { key: 'ProductMessages.CATEGORY_DELETED' } };
	}
});
