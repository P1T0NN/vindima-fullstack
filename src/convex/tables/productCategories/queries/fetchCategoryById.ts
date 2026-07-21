/**
 * Load one category for the admin edit page (`/admin/categories/edit-category/[id]`).
 * Admin-only. A malformed / unknown id resolves to `null` so the page can render a clean
 * "not found" instead of throwing.
 */

// LIBRARIES
import { query } from '@/convex/_generated/server';
import { v } from 'convex/values';

// MIDDLEWARE
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

export const fetchCategoryById = query({
	args: { categoryId: v.string() },
	handler: async (ctx, args): Promise<Doc<'productCategories'> | null> => {
		await requireAdmin(ctx);

		const id = ctx.db.normalizeId('productCategories', args.categoryId);
		if (!id) return null;

		return await ctx.db.get(id);
	}
});
