// LIBRARIES
import { v, type GenericValidator } from 'convex/values';

// HELPERS
import { cursorPagination, normalizePaginationOptions } from '../utils/cursorPagination.js';

// TYPES
import type {
	ConvexPaginatedSource,
	ConvexPaginatedPage,
	GetPaginationOptions
} from '../../shared/features/pagination/types/paginationTypesConvex.js';

/** Adapt a native Convex paginated query to the shared page result contract. */
export async function getPagination<T>(
	source: ConvexPaginatedSource<T>,
	options: GetPaginationOptions = {}
): Promise<ConvexPaginatedPage<T>> {
	const paginationOpts = options.paginationOpts
		? normalizePaginationOptions(options.paginationOpts)
		: cursorPagination(options);

	const result = await source.paginate(paginationOpts);

	return {
		items: result.page,
		nextCursor: result.isDone ? null : result.continueCursor,
		hasNextPage: !result.isDone,
		pageSize: paginationOpts.numItems
	};
}

/** Validator for the page contract returned by fetchOptimizedQuery. */
export function paginatedPageValidator<Item extends GenericValidator>(item: Item) {
	return v.object({
		items: v.array(item),
		nextCursor: v.union(v.string(), v.null()),
		hasNextPage: v.boolean(),
		pageSize: v.number(),
		total: v.optional(v.number())
	});
}
