/**
 * Hard-delete a product + its variants (ProductsTableSystemDesign.md §6).
 *
 * Allowed ONLY for a product that was never activated (`wasActive !== true`) — a shipped ref is
 * honored forever, so anything ever active (or archived after being active) must be archived, not
 * deleted. The `wasActive` latch makes this an O(1) check instead of scanning order lines.
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

export const deleteProduct = adminMutation({
	args: { productId: v.id('products') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const product = await ctx.db.get(args.productId);
		if (!product) {
			return { success: false, message: 'No encontramos ese producto.' };
		}

		// Ever activated → refuse; archive instead.
		if (product.wasActive) {
			return {
				success: false,
				message: 'Este producto ha estado activo, así que solo se puede archivar, no eliminar.'
			};
		}

		// Never-activated draft — safe to hard-delete. Remove variants first (no FK cascade).
		const variants = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', args.productId))
			.collect();
		for (const variant of variants) await ctx.db.delete(variant._id);
		await deleteStoredFiles(ctx, product.images);
		await ctx.db.delete(args.productId);

		return { success: true, message: 'Producto eliminado.' };
	}
});
