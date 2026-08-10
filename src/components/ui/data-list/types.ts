/**
 * What the `item` snippet receives. `index` is the position within the current page — the
 * template ships `{ item }` only; this project also passes `index` because call sites use it
 * for ordinals and row-scoped ids.
 */
export type DataListItemSnippetProps<T> = {
	item: T;
	index: number;
};

export type DataListControlsPlace = 'top' | 'bottom';
