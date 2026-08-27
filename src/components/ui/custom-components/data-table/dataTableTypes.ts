// TYPES
import type { Snippet } from 'svelte';
import type { PaginationPlacement } from '@/components/ui/custom-components/paginated-data/types.js';
import type { PaginationState } from '@/shared/features/pagination/types/paginationTypes.js';

export type DataTableProps<T> = {
	pagination: PaginationState<T>;
	total?: number | null;
	placement?: PaginationPlacement;
	header?: Snippet;
	head?: Snippet;
	row: Snippet<[item: T, index: number]>;
	selectable?: boolean;
	borderless?: boolean;
	loadingSnippet?: Snippet;
	errorSnippet?: Snippet<[error: unknown]>;
	empty?: Snippet;
	key?: (item: T) => PropertyKey;
	actions?: Snippet<
		[{ selectedKeys: ReadonlySet<PropertyKey>; count: number; onClear: () => void }]
	>;
	class?: string;
};
