/**
 * Rename a category's display name (ProductCategorySystemDesign.md §5).
 *
 * Patches `name` ONLY — the slug is immutable (products store it verbatim; touching it
 * would orphan them). Pickers and listings update reactively via Convex subscriptions.
 */

// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { renameCategorySchema } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const renameCategory = adminMutation('renameCategory')({
	args: {
		...zodToConvexFields(renameCategorySchema.shape),
		categoryId: v.id('productCategories')
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (name non-empty after trim).
		const parsed = renameCategorySchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NAME_REQUIRED' } };
		}
		const name = parsed.data.name;

		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NOT_FOUND' } };
		}

		await ctx.db.patch(args.categoryId, { name });

		ctx.audit(AUDIT_ACTIONS.CATEGORY_RENAME, {
			resource: { table: 'productCategories', id: args.categoryId },
			before: { name: category.name },
			after: { name }
		});

		return { success: true, message: { key: 'ProductMessages.CATEGORY_RENAMED' } };
	}
});
