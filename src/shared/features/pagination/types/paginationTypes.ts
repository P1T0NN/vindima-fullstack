/** Live pagination state exposed by a Convex useQuery subscription. */
export type PaginationState<T> = {
	page: number;
	data: T[];
	loading: boolean;
	error?: unknown;
	nextCursor: string | null;
	pageSize?: number;
	total?: number;
	onPrev: () => void;
	onNext: () => void;
};

/** One bounded server response consumed by an infinite-pagination client. */
export type InfinitePage<T> = {
	items: T[];
	nextCursor: string | null;
	hasNextPage: boolean;
	pageSize: number;
	total?: number;
};

/** Client state for server-backed infinite scrolling. */
export type InfinitePaginationState<T> = {
	data: T[];
	total?: number;
	loading: boolean;
	loadingMore: boolean;
	hasNextPage: boolean;
	error?: unknown;
	loadMore: () => void;
	retry: () => void;
};
