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
import { adminUploadMutation } from '@/convex/builders/convexFunctionBuilders';

// SCHEMAS
import { editCategorySchema } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/stringUtils';
import { isUsableImageUrl } from '@/shared/utils/imageValue';
import { deleteStoredFiles, resolveStoredFileUrls } from '@/convex/storage/r2';

// TYPES
import type { ConvexMutationResult } from '@/shared/types/types';

export const editCategory = adminUploadMutation({
	args: {
		...zodToConvexFields(editCategorySchema.shape),
		categoryId: v.id('productCategories')
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		const parsed = editCategorySchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: 'Se requiere un nombre de categoría.' };
		}

		const category = await ctx.db.get(args.categoryId);
		if (!category) {
			return { success: false, message: 'No encontramos esa categoría.' };
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

		let nextImage: string | undefined;
		if (parsed.data.image !== undefined) {
			const [uploadedImage] = await resolveStoredFileUrls(args.uploadedFiles ?? []);
			const image = uploadedImage ?? parsed.data.image;
			if (!isUsableImageUrl(image))
				return {
					success: false,
					message: 'No se pudo guardar la imagen de la categoría. Vuelve a subirla.'
				};
			patch.image = image;
			nextImage = image;
		}

		await ctx.db.patch(args.categoryId, patch);
		if (nextImage !== undefined && category.image !== undefined) {
			await deleteStoredFiles(ctx, [category.image], [nextImage]);
		}

		return { success: true, message: 'Categoría actualizada.' };
	}
});
