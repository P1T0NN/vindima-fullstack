/**
 * Load one product + its variants for the admin edit page (`/admin/products/edit-product/[id]`).
 * Admin-only. Mirrors `fetchAllProducts`' row shape (variants attached, sorted) but for a single
 * product. A malformed / unknown id resolves to `null` so the page can render a clean "not found".
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// CONFIG
import { CATALOG_CONFIG } from '@/shared/config.js';

// MIDDLEWARE
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

export const fetchProductById = query({
	args: { productId: v.string() },
	handler: async (ctx, args): Promise<AdminProductRow | null> => {
		await requireAdmin(ctx);

		const id = ctx.db.normalizeId('products', args.productId);
		if (!id) return null;

		const product = await ctx.db.get(id);
		if (!product) return null;

		const variants = (
			await ctx.db
				.query('productVariants')
				.withIndex('by_product', (q) => q.eq('productId', product._id))
				.take(CATALOG_CONFIG.MAX_VARIANTS_PER_PRODUCT)
		).filter((variant) => variant.deletedAt === undefined); // hide tombstones
		variants.sort((a, b) => a.sortOrder - b.sortOrder);

		return { ...product, variants };
	}
});
