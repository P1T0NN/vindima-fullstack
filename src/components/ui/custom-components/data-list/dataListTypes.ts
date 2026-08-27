import type { Snippet } from 'svelte';

import type { PaginationPlacement } from '@/components/ui/custom-components/paginated-data/types.js';
import type {
	InfinitePaginationState,
	PaginationState
} from '@/shared/features/pagination/types/paginationTypes.js';

type DataListCommonProps<T> = {
	total?: number | null;
	placement?: PaginationPlacement;
	/** Hide page controls when the supplied state represents a bounded one-shot list. */
	showPagination?: boolean;
	header?: Snippet;
	empty?: Snippet;
	loadingSnippet?: Snippet;
	errorSnippet?: Snippet<[error: unknown]>;
	key?: (item: T) => PropertyKey;
	class?: string;
	children: Snippet<[item: T, index: number]>;
};

export type DataListProps<T> = DataListCommonProps<T> &
	(
		| {
				infiniteScrolling?: false;
				pagination: PaginationState<T>;
		  }
		| {
				infiniteScrolling: true;
				pagination: InfinitePaginationState<T>;
		  }
	);
