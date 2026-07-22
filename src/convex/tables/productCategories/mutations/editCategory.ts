/**
 * Edit a category's owner-facing fields — name, card image and description
 * (ProductCategorySystemDesign.md §5).
 *
 * The `slug` is NOT editable: products store it verbatim, so changing it would orphan them.
 * That's also why it never appears in any input schema. Patch semantics mirror the product
 * edit form: `image` omitted keeps the current one (an admin who doesn't touch the picker
 * can't accidentally clear it), while an empty `description` clears the field.
 */

// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { editCategorySchema } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/validationUtils';

// HELPERS
import { resolveImageUrl } from '@/convex/storage/r2/resolveImageUrl';

// TYPES
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const editCategory = adminMutation('editCategory')({
	args: {
		...zodToConvexFields(editCategorySchema.shape),
		categoryId: v.id('productCategories')
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		const parsed = editCategorySchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NAME_REQUIRED' } };
		}

		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			return { success: false, message: { key: 'ProductMessages.CATEGORY_NOT_FOUND' } };
		}

		const name = parsed.data.name; // already trimmed by the schema
		const patch: Record<string, unknown> = { name };

		// Sent-but-empty clears the line; absent leaves it untouched (`undefined` in a Convex
		// patch removes the field).
		if (parsed.data.description !== undefined) {
			patch.description = trimToUndefined(parsed.data.description);
		}
		if (parsed.data.subtitle !== undefined) {
			patch.subtitle = trimToUndefined(parsed.data.subtitle);
		}

		if (parsed.data.image !== undefined) {
			const image = await resolveImageUrl(ctx, parsed.data.image);
			// Refuse rather than blanking the card image on a bad ref.
			if (!image)
				return { success: false, message: { key: 'ProductMessages.CATEGORY_IMAGE_INVALID' } };
			patch.image = image;
		}

		await ctx.db.patch(args.categoryId, patch);

		ctx.audit(AUDIT_ACTIONS.CATEGORY_UPDATE, {
			resource: { table: 'productCategories', id: args.categoryId },
			before: { name: category.name, hasImage: category.image !== undefined },
			after: { name, hasImage: (patch.image ?? category.image) !== undefined }
		});

		return { success: true, message: { key: 'ProductMessages.CATEGORY_UPDATED' } };
	}
});
