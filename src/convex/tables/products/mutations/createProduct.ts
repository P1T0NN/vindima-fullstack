/**
 * Create a product + its variants in one transaction (ProductsTableSystemDesign.md §6).
 *
 * Input validation is the SHARED `createProductSchema`
 * (`@/shared/features/products/schemas/productsSchemas`) — the same schema the admin form
 * runs pre-submit. Args are derived from it (`zodToConvexFields`), and the handler re-runs
 * it authoritatively; a failure returns a generic soft-fail envelope (no per-issue
 * messages for now). The `slug` is DERIVED here from the product name (same rule as
 * `createCategory` — admins never type identifiers), with a numeric suffix on collision so
 * two products may share a name. Only DB-dependent rules live here:
 * every ref unique (`by_ref`), category exists. Status comes from the
 * form's publish switch (`draft` when absent); `wasActive` latches on creation-as-active, so a
 * product published straight away is never hard-deletable (a shipped ref is a public contract).
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminUploadMutation } from '@/convex/builders/convexFunctionBuilders';

// SCHEMAS
import { createProductSchema } from '@/shared/features/products/schemas/productsSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/stringUtils';
import { resolveStoredFileUrls } from '@/convex/storage/r2';

// HELPERS
import { resolveImageUrls } from '../helpers/resolveImageUrls';
import { getProductSlug } from '../helpers/getProductSlug';

// TYPES
import type { ConvexMutationResult } from '@/shared/types/types';

export const createProduct = adminUploadMutation({
	args: zodToConvexFields(createProductSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		// No per-issue messages for now — a schema failure returns a generic display-ready message.
		const parsed = createProductSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: 'Ocurrió un error inesperado. Inténtalo de nuevo.' };
		}

		// Post-parse cleanup: `name` is already trimmed by the schema; '' → absent for the rest.
		const { category, name, featured } = parsed.data;
		// Absent = draft: a scripted caller that omits it can never publish by accident.
		const status = parsed.data.status ?? 'draft';
		const description = trimToUndefined(parsed.data.description);
		const uploadedKeys = args.uploadedFiles ?? [];
		const uploadedUrls = await resolveStoredFileUrls(uploadedKeys);
		const uploadedUrlByKey = new Map(uploadedKeys.map((key, index) => [key, uploadedUrls[index]]));
		const images = resolveImageUrls(
			parsed.data.images.map((image) => uploadedUrlByKey.get(image) ?? image)
		);
		if (images.length === 0) return fail('No se pudo guardar la imagen del producto. Vuelve a subirla.');
		const cleanedVariants = parsed.data.variants.map((variant) => ({
			...variant,
			label: trimToUndefined(variant.label)
		}));

		// Runtime category safety (ProductCategorySystemDesign.md §5): the slug must exist in
		// `productCategories` — even a scripted caller bypassing the UI can't write a typo.
		const categoryRow = await ctx.db
			.query('productCategories')
			.withIndex('by_slug', (q) => q.eq('slug', category))
			.unique();
		if (!categoryRow) return fail('Esa categoría no existe. Elige una de la lista.');

		// Derived, never typed — the admin only ever names the product.
		const slug = await getProductSlug(ctx, name);

		// Uniqueness against the DB (OCC serializes concurrent duplicate creates).
		for (const variant of cleanedVariants) {
			const refTaken = await ctx.db
				.query('productVariants')
				.withIndex('by_ref', (q) => q.eq('ref', variant.ref))
				.unique();
			if (refTaken) return fail('Esa referencia de variante ya está en uso.');
		}

		// Ordering is auto-assigned, never typed by the admin: a new product is appended to the end
		// of its category (highest existing sortOrder + 1).
		const categoryProducts = await ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category))
			.collect();
		const productSortOrder =
			categoryProducts.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;

		const productId = await ctx.db.insert('products', {
			slug,
			name,
			description,
			images,
			category,
			status,
			featured,
			// Latch on creation-as-active — same rule as `setProductStatus`: once live, the
			// product archives instead of hard-deleting forever after.
			wasActive: status === 'active',
			sortOrder: productSortOrder
		});

		// Variant order = the order the admin listed them in the form (top to bottom).
		let variantSortOrder = 0;
		for (const variant of cleanedVariants) {
			await ctx.db.insert('productVariants', {
				productId,
				ref: variant.ref,
				label: variant.label,
				priceMinor: variant.priceMinor,
				available: variant.available,
				sortOrder: variantSortOrder++
			});
		}

		return { success: true, message: 'Producto creado.' };
	}
});

function fail(message: string): ConvexMutationResult {
	return { success: false, message };
}
