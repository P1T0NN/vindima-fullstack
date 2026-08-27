/**
 * Create a product category (ProductCategorySystemDesign.md §5).
 *
 * The owner types a display name, a one-line description and picks a card image; the slug —
 * THE string `products.category` stores — is derived here once (lowercase kebab-case) and is
 * immutable thereafter. The storefront's price range is NOT stored: it's computed from the
 * category's products so it can never drift from real prices. Uniqueness is
 * enforced on the slug (`by_slug`; OCC serializes concurrent duplicate creates), so two
 * names that slugify identically ("Boards" / "boards!") collide by design — they'd be the
 * same grouping key. `sortOrder` is auto-assigned (append), same convention as products.
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminUploadMutation } from '@/convex/builders/convexFunctionBuilders';

// SCHEMAS
import { createCategorySchema } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

// UTILS
import { slugify } from '@/shared/utils/slugify';
import { trimToUndefined } from '@/shared/utils/stringUtils';
import { isUsableImageUrl } from '@/shared/utils/imageValue';
import { resolveStoredFileUrls } from '@/convex/storage/r2';

export const createCategory = adminUploadMutation({
	args: zodToConvexFields(createCategorySchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (name non-empty after trim).
		const parsed = createCategorySchema.safeParse(args);
		if (!parsed.success) return fail('Se requiere un nombre de categoría.');
		const name = parsed.data.name;

		// Non-Latin names can slugify to nothing — treated as a missing name in v1 (§8).
		const slug = slugify(name);
		if (!slug) return fail('Se requiere un nombre de categoría.');

		const taken = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', slug))
			.unique();
		if (taken) return fail('Esa categoría ya existe.');

		// The card image is required, so an unresolvable ref fails the whole create rather
		// than silently producing a category that renders as a hole on the storefront.
		const [uploadedImage] = await resolveStoredFileUrls(args.uploadedFiles ?? []);
		const image = uploadedImage ?? parsed.data.image;
		if (!isUsableImageUrl(image)) {
			return fail('No se pudo guardar la imagen de la categoría. Vuelve a subirla.');
		}

		const description = trimToUndefined(parsed.data.description);
		const subtitle = trimToUndefined(parsed.data.subtitle);

		// Append to the end of the picker, same auto-assign convention as createProduct.
		const all = await ctx.db.query('productCategories').collect();
		const sortOrder = all.reduce((max, c) => Math.max(max, c.sortOrder), -1) + 1;

		await ctx.db.insert('productCategories', {
			slug,
			name,
			subtitle,
			image,
			description,
			sortOrder
		});

		return { success: true, message: 'Categoría creada.' };
	}
});

function fail(message: string): ConvexMutationResult {
	return { success: false, message };
}
