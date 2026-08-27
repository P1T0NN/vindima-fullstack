/**
 * Admin catalog list (ProductsTableSystemDesign.md §6) — paginated full catalog (drafts +
 * archived included), variants attached, for the `/admin/products` DataTable. Cursor mode,
 * newest first.
 *
 * Optional admin controls arrive as normalized wrapper inputs:
 *  - `search` non-empty     → full-text `search_name` index, category/status-filterable.
 *  - category + status      → `by_category_status`.
 *  - category only          → `by_category_status` (category prefix).
 *  - status only            → `by_status`.
 *  - no controls            → default newest-first table order.
 */

// WRAPPER
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import type { Bounds } from '@convex-dev/aggregate';
import { getFilteredTotalAggregate } from '@/convex/aggregates/helpers/getFilteredTotalAggregate.js';
import { productFilterAggregate } from '../aggregates/productFilterAggregate.js';
import { productTotalCounter, PRODUCT_TOTAL_COUNTER_KEY } from '../counters/productTotalCounter.js';

// HELPERS
import { getProductsPage } from '../helpers/getProductsPage.js';

// VALIDATORS
import { adminProductsPage } from '../validators/productsValidators.js';

// TYPES
import type { Id } from '@/convex/_generated/dataModel.js';
import type { ConvexFilter } from '@/shared/features/filters/types/filterTypesConvex.js';
import type {
	ProductFilterAggregateKey,
	ProductStatus
} from '../aggregates/productFilterAggregate.js';

const PRODUCT_STATUSES = [
	'draft',
	'active',
	'archived'
] as const satisfies readonly ProductStatus[];

function filterValue(filters: ConvexFilter[], field: string): string | undefined {
	const value = filters.find((filter) => filter.field === field)?.eq;
	return typeof value === 'string' ? value : undefined;
}

function statusValue(filters: ConvexFilter[]): ProductStatus | undefined {
	const value = filterValue(filters, 'status');
	return PRODUCT_STATUSES.includes(value as ProductStatus) ? (value as ProductStatus) : undefined;
}

function productPrefixBounds(
	prefix: [ProductStatus] | [ProductStatus, string]
): Bounds<ProductFilterAggregateKey, Id<'products'>> {
	return { prefix };
}

export const fetchAllProducts = fetchOptimizedQuery({
	auth: 'admin',
	returns: adminProductsPage,
	count: productFilterAggregate,
	countTotal: ({ ctx }) => productTotalCounter.count(ctx, PRODUCT_TOTAL_COUNTER_KEY),
	predicateFor: (key, value) => {
		if (key === 'category' && value) return { field: 'category', eq: value };
		if (key === 'status' && ['draft', 'active', 'archived'].includes(value)) {
			return { field: 'status', eq: value };
		}
		return undefined;
	},
	filteredTotal: 'exact',
	countFiltered: async ({ ctx, search, filters }) => {
		if (search) return undefined;

		const category = filterValue(filters, 'category');
		const status = statusValue(filters);
		const statuses = status ? [status] : PRODUCT_STATUSES;
		const queries = category
			? statuses.map((statusValue) => ({
					bounds: productPrefixBounds([statusValue, category])
				}))
			: status
				? [{ bounds: productPrefixBounds([status]) }]
				: [];

		return getFilteredTotalAggregate(ctx, productFilterAggregate, queries);
	},
	fetchPage: ({ ctx, paginationOpts, search, filters }) =>
		getProductsPage(ctx, paginationOpts, search, filters)
});
