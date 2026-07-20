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
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const deleteProduct = adminMutation('deleteProduct')({
	args: { productId: v.id('products') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const product = await ctx.db.get(args.productId);
		if (!product) {
			return { success: false, message: { key: 'ProductMessages.PRODUCT_NOT_FOUND' } };
		}

		// Ever activated → refuse; archive instead. Records the blocked attempt.
		if (product.wasActive) {
			ctx.audit(AUDIT_ACTIONS.PRODUCT_DELETE, {
				resource: { table: 'products', id: args.productId },
				status: 'failure',
				errorMessage: 'PRODUCT_NOT_DRAFT'
			});
			return { success: false, message: { key: 'ProductMessages.PRODUCT_NOT_DRAFT' } };
		}

		// Never-activated draft — safe to hard-delete. Remove variants first (no FK cascade).
		const variants = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', args.productId))
			.collect();
		for (const variant of variants) await ctx.db.delete(variant._id);
		await ctx.db.delete(args.productId);

		ctx.audit(AUDIT_ACTIONS.PRODUCT_DELETE, {
			resource: { table: 'products', id: args.productId },
			before: { slug: product.slug, variantCount: variants.length }
		});

		return { success: true, message: { key: 'ProductMessages.PRODUCT_DELETED' } };
	}
});
