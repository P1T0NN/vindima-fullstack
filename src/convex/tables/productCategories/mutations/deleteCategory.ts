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
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

// STORAGE
import { deleteStoredFiles } from '@/convex/storage/r2';

// The `deleteCategorySchema` wire shape is just this one id — the `v.id` validator IS the
// stronger check, so deriving it from zod would only weaken it.
export const deleteCategory = adminMutation({
	args: { categoryId: v.id('productCategories') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			return { success: false, message: 'No encontramos esa categoría.' };
		}

		// In-use guard — one indexed row is enough to refuse.
		const inUse = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category.slug))
			.first();
		if (inUse) {
			return {
				success: false,
				message: 'Esta categoría todavía tiene productos. Muévelos o elimínalos primero.'
			};
		}

		if (category.image) await deleteStoredFiles(ctx, [category.image]);
		await ctx.db.delete(args.categoryId);

		return { success: true, message: 'Categoría eliminada.' };
	}
});
