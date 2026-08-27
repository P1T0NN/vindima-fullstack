// LIBRARIES
import type { PaginationOptions } from 'convex/server';

// CONVEX
import type { QueryCtx } from '../_generated/server';

// HELPERS
import { getPagination } from './getPagination.js';

// TYPES
import type { ConvexFilter } from '../../shared/features/filters/types/filterTypesConvex.js';
import type {
	ConvexPaginatedPage,
	ConvexPaginatedSource
} from '../../shared/features/pagination/types/paginationTypesConvex.js';

type BuildSearchQuery<T> = (args: {
	ctx: QueryCtx;
	search: string;
	filters: ConvexFilter[];
}) => ConvexPaginatedSource<T>;

type PaginateSearchOptions<T> = {
	ctx: QueryCtx;
	search: string;
	filters: ConvexFilter[];
	paginationOpts: PaginationOptions;
	buildQuery: BuildSearchQuery<T>;
};

export function paginateSearch<T>({
	ctx,
	search,
	filters,
	paginationOpts,
	buildQuery
}: PaginateSearchOptions<T>): Promise<ConvexPaginatedPage<T>> {
	// Convex treats every word in a multi-word search as a match candidate. Use
	// the final token so typing "Seed Task 10" searches the useful prefix "10"
	// instead of matching every title containing "Seed" or "Task".
	const searchTokens = search.trim().split(/\s+/);
	const searchTerm = searchTokens[searchTokens.length - 1] || search;

	return getPagination(buildQuery({ ctx, search: searchTerm, filters }), { paginationOpts });
}
