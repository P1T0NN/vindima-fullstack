// LIBRARIES
import type { PaginationOptions } from 'convex/server';

// CONVEX
import type { QueryCtx } from '@/convex/_generated/server.js';
import type { Doc } from '@/convex/_generated/dataModel.js';

// HELPERS
import { getPagination } from '@/convex/helpers/getPagination.js';
import { attachVariants } from './attachVariants.js';

// TYPES
import type { ConvexFilter } from '@/shared/features/filters/types/filterTypesConvex.js';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';
import type { AdminProductRow } from '@/shared/features/products/types/productsTypes.js';

type ProductStatus = 'draft' | 'active' | 'archived';

function filterValue(filters: ConvexFilter[], field: string): string | undefined {
	const value = filters.find((filter) => filter.field === field)?.eq;
	return typeof value === 'string' ? value : undefined;
}

function statusValue(filters: ConvexFilter[]): ProductStatus | undefined {
	const value = filterValue(filters, 'status');
	return value === 'draft' || value === 'active' || value === 'archived' ? value : undefined;
}

async function withVariants(
	ctx: QueryCtx,
	page: ConvexPaginatedPage<Doc<'products'>>
): Promise<ConvexPaginatedPage<AdminProductRow>> {
	return {
		...page,
		items: await attachVariants(ctx, page.items)
	};
}

/** Read one bounded, indexed products page and enrich only the returned rows. */
export async function getProductsPage(
	ctx: QueryCtx,
	paginationOpts: PaginationOptions,
	search: string | undefined,
	filters: ConvexFilter[]
): Promise<ConvexPaginatedPage<AdminProductRow>> {
	const category = filterValue(filters, 'category');
	const status = statusValue(filters);

	if (search) {
		const source = ctx.db.query('products').withSearchIndex('search_name', (q) => {
			let searchQuery = q.search('name', search);
			if (category) searchQuery = searchQuery.eq('category', category);
			if (status) searchQuery = searchQuery.eq('status', status);
			return searchQuery;
		});

		return withVariants(ctx, await getPagination(source, { paginationOpts }));
	}

	if (category && status) {
		const source = ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category).eq('status', status))
			.order('desc');
		return withVariants(ctx, await getPagination(source, { paginationOpts }));
	}

	if (category) {
		const source = ctx.db
			.query('products')
			.withIndex('by_category_status', (q) => q.eq('category', category))
			.order('desc');
		return withVariants(ctx, await getPagination(source, { paginationOpts }));
	}

	if (status) {
		const source = ctx.db
			.query('products')
			.withIndex('by_status', (q) => q.eq('status', status))
			.order('desc');
		return withVariants(ctx, await getPagination(source, { paginationOpts }));
	}

	const source = ctx.db.query('products').order('desc');
	return withVariants(ctx, await getPagination(source, { paginationOpts }));
}
