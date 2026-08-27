// TYPES
import type { Cursor, PaginationOptions, PaginationResult } from 'convex/server';
import type { ConvexFilter } from '../../filters/types/filterTypesConvex.js';

type ConvexCursor = Cursor;

export type GetPaginationOptions = {
	cursor?: ConvexCursor | null;
	pageSize?: number;
	paginationOpts?: PaginationOptions;
};

export type ConvexPaginatedPage<T> = {
	items: T[];
	nextCursor: ConvexCursor | null;
	hasNextPage: boolean;
	pageSize: number;
	total?: number;
};

export type ConvexPaginatedSource<T> = {
	paginate(options: PaginationOptions): Promise<PaginationResult<T>>;
};

export type ConvexPageResult<T> = PaginationResult<T>;

export type ConvexFetchPage<C, T> = (args: {
	ctx: C;
	paginationOpts: PaginationOptions;
	search?: string;
	filters: ConvexFilter[];
}) => Promise<ConvexPaginatedPage<T>>;

export type CountFiltered<C> = (args: {
	ctx: C;
	search?: string;
	filters: ConvexFilter[];
}) => Promise<number | undefined>;
