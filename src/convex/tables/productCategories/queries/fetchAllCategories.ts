/**
 * All product categories, sorted by `sortOrder` for the admin categories table.
 * Public category data; totals stay intentionally omitted until an aggregate is needed.
 */

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { productCategoryFilterAggregate } from '../aggregates/productCategoryFilterAggregate.js';
import {
	PRODUCT_CATEGORY_TOTAL_COUNTER_KEY,
	productCategoryTotalCounter
} from '../counters/productCategoryTotalCounter.js';

// VALIDATORS
import { categoryRowValidator } from '../validators/productCategoriesValidators.js';

export const fetchAllCategories = fetchOptimizedQuery({
	returns: paginatedPageValidator(categoryRowValidator),
	count: productCategoryFilterAggregate,
	countTotal: ({ ctx }) =>
		productCategoryTotalCounter.count(ctx, PRODUCT_CATEGORY_TOTAL_COUNTER_KEY),
	fetchPage: ({ ctx, paginationOpts }) =>
		getPagination(ctx.db.query('productCategories').withIndex('by_sort_order').order('asc'), {
			paginationOpts
		})
});
