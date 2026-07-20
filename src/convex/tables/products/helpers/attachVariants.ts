/**
 * Attach each product's live variants (tombstones hidden), sorted by `sortOrder`.
 *
 * Shaped as a `fetchOptimized` `enrich` step: 1:1 with the input page, same order, and
 * bounded — it only ever runs on an already-paginated page, so the join cost is
 * O(perPage · variants), never O(table).
 */

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';
import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

/** One variant axis per product (ProductsTableSystemDesign.md §2); a handful of rows at most. */
const MAX_VARIANTS_PER_PRODUCT = 64;

export async function attachVariants(
	ctx: QueryCtx,
	page: Doc<'products'>[]
): Promise<AdminProductRow[]> {
	return await Promise.all(
		page.map(async (product) => {
			const variants = (
				await ctx.db
					.query('productVariants')
					.withIndex('by_product', (q) => q.eq('productId', product._id))
					.take(MAX_VARIANTS_PER_PRODUCT)
			).filter((variant) => variant.deletedAt === undefined); // hide tombstones
			variants.sort((a, b) => a.sortOrder - b.sortOrder);
			return { ...product, variants };
		})
	);
}
