/**
 * Rename a category's display name (ProductCategorySystemDesign.md §5).
 *
 * Patches `name` ONLY — the slug is immutable (products store it verbatim; touching it
 * would orphan them). Pickers and listings update reactively via Convex subscriptions.
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const renameCategory = adminMutation('renameCategory')({
	args: {
		categoryId: v.id('productCategories'),
		name: v.string()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const name = args.name.trim();
		if (!name) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NAME_REQUIRED' } };
		}

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
