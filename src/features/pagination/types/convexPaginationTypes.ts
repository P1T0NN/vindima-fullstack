// TYPES
import type { UseQueryReturn } from 'convex-svelte';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';

export type ConvexPaginationQueryArgs<Query extends FunctionReference<'query'>> = Omit<
	FunctionArgs<Query>,
	'paginationOpts'
>;

export type ConvexPaginationItem<Query extends FunctionReference<'query'>> =
	FunctionReturnType<Query> extends { items: (infer Item)[] } ? Item : never;

export type PaginationResetValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| PaginationResetValue[]
	| { [key: string]: PaginationResetValue };

export type ConvexPaginationArgs<Query extends FunctionReference<'query'>> =
	() => ConvexPaginationQueryArgs<Query>;

export type ConvexPaginationOptions = {
	pageSize?: number;
	/** JSON-compatible values that identify a new result set; pagination serializes them internally. */
	resetKey?: () => PaginationResetValue;
};

export type ConvexInfinitePaginationOptions<Item> = ConvexPaginationOptions & {
	getItemKey?: (item: Item) => string | undefined;
};

export type InfinitePaginationSession<Item> = {
	key: string | undefined;
	cursor: string | null;
	nextCursor: string | null;
	hasNextPage: boolean;
	data: Item[];
	total?: number;
	initialized: boolean;
	loadingMore: boolean;
	retrying: boolean;
	acceptedQueryKey?: string;
};

export type LoadMorePaginationOptions<Item> = {
	queryEnabled: boolean;
	loadingMore: boolean;
	currentPage: ConvexPaginatedPage<Item> | undefined;
	retrying: boolean;
	visibleHasNextPage: boolean;
	isCurrentSession: boolean;
	resetKey: string;
	queryKey: string;
	getItemKey?: (item: Item) => string | undefined;
	getSession: () => InfinitePaginationSession<Item>;
	createSession: (key: string) => InfinitePaginationSession<Item>;
	setSession: (session: InfinitePaginationSession<Item>) => void;
};

export type RetryPaginationOptions<Item> = {
	queryEnabled: boolean;
	visibleError: unknown;
	retrying: boolean;
	resetKey: string;
	getSession: () => InfinitePaginationSession<Item>;
	createSession: (key: string) => InfinitePaginationSession<Item>;
	setSession: (session: InfinitePaginationSession<Item>) => void;
	setQueryEnabled: (enabled: boolean) => void;
};

export type CreateConvexPaginationQueryOptions = ConvexPaginationOptions & {
	getCursor: (resetKey: string) => string | null;
	getEnabled?: () => boolean;
	keepPreviousData?: boolean;
};

export type ConvexPaginationQueryState<Query extends FunctionReference<'query'>> = {
	readonly resetKey: string;
	readonly queryKey: string;
	readonly freshPage: ConvexPaginatedPage<ConvexPaginationItem<Query>> | undefined;
	readonly result: UseQueryReturn<Query>;
};
