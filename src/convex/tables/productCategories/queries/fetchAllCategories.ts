/**
 * All product categories, sorted by `sortOrder` (ProductCategorySystemDesign.md §5).
 *
 * Public (no auth): category names are public data — the shop renders them. Feeds the
 * admin form select (via the layout subscription mirrored into `productCategoriesClass`)
 * and the /admin/categories ConvexDataTable. Offset strategy: the table is single-digit
 * rows, and offset gives the table exact totals + page jumps.
 */

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

export const fetchAllCategories = fetchOptimized({
	table: 'productCategories',
	strategy: 'offset',
	order: 'asc',
	where: () => ({ index: 'by_sort_order' })
});
