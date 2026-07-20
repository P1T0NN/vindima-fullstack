/**
 * Public category listing (ProductsTableSystemDesign.md §5, last ¶).
 *
 * `{ category }` → `status: 'active'` products with their variants attached, both sorted
 * by `sortOrder`. Product order comes straight from the `by_category_status` index (its
 * trailing field is `sortOrder`), so pages arrive pre-sorted at O(perPage). The `enrich`
 * step joins variants and projects the public shape; `rowValidator` proves server-side
 * that nothing beyond that shape (e.g. `wasActive`) reaches the client.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { attachVariants } from '../helpers/attachVariants';

// VALIDATORS
import { shopProductRow } from '../validators/productsValidators';

export const fetchProductsByCategory = fetchOptimized({
	table: 'products',
	args: { category: v.string() },
	// Ascending along (category, status, sortOrder) = shop display order.
	order: 'asc',
	where: (_ctx, args) => ({
		index: 'by_category_status',
		eq: { category: args.category, status: 'active' as const }
	}),
	rowValidator: shopProductRow,
	enrich: async (ctx, page) =>
		(await attachVariants(ctx, page)).map((product) => ({
			_id: product._id,
			slug: product.slug,
			name: product.name,
			description: product.description ?? null,
			images: product.images,
			category: product.category,
			featured: product.featured ?? false,
			sortOrder: product.sortOrder,
			variants: product.variants.map((variant) => ({
				_id: variant._id,
				ref: variant.ref,
				label: variant.label ?? null,
				priceMinor: variant.priceMinor,
				available: variant.available,
				sortOrder: variant.sortOrder
			}))
		}))
});
