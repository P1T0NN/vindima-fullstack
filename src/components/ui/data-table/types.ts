import type { Snippet } from 'svelte';

/**
 * Pagination strategy expected by adapters that feed DataTable.
 *
 * | strategy   | totalCount | jump-to-page | best for                        |
 * | ---------- | ---------- | ------------ | ------------------------------- |
 * | `'cursor'` | unknown    | no           | any table that may grow large   |
 * | `'offset'` | exact      | yes          | small, finite tables (<~few k)  |
 */
export type DataTableOptimizationStrategy = 'cursor' | 'offset';

// `PaginatedListPayload` lives in `@/shared/features/pagination/types/paginationTypes` —
// Convex queries declare it as their return type, and this file imports `Snippet` from
// `svelte`, so it must not be the home of a type the backend needs. Import it from there.

/** Minimum breakpoint at which the column becomes visible in the table layout. */
export type ColumnHideBelow = 'sm' | 'md' | 'lg';

/**
 * Subset of column metadata used by loading skeletons (no row / `T`, so any `ColumnDef<T>` fits).
 */
export type DataTableSkeletonColumn = {
	id: string;
	header: string;
	hideBelow?: ColumnHideBelow;
	cellClass?: string;
};

export type ColumnDef<T> = {
	id: string;
	header: string;
	accessor: (row: T) => unknown;
	headerClass?: string;
	cellClass?: string;
	/**
	 * Column is hidden below this breakpoint in the table (`hidden ${bp}:table-cell`).
	 * In the mobile card layout, columns with `md` or `lg` are omitted (card only shows below `md`).
	 * Columns with `sm` stay in the card so small phones still see primary fields.
	 */
	hideBelow?: ColumnHideBelow;
	/**
	 * When set (and no `customCells` entry for this column), the cell renders as a localized
	 * `Link` using the accessor value as the visible label.
	 */
	linkHref?: (row: T) => string;
	/**
	 * Render a small copy-to-clipboard button next to the cell value. Useful for long
	 * truncated values (URLs, IDs) where selecting the visible text isn't enough.
	 * Copies `String(accessor(row))`.
	 */
	hasCopy?: boolean;
	/**
	 * Opt out of single-line ellipsis truncation. When true, the cell wrapper drops
	 * `truncate` so multi-line content (badges, stacked metadata, long-form text) can
	 * wrap normally. Default is `false` — tabular data should stay one line per row.
	 */
	wrap?: boolean;
	/**
	 * Render the header as a clickable sort toggle. Clicking cycles `desc → asc → off` and
	 * surfaces `{ sortColumn: col.id, sortDirection }` through the table's `queryArgs`.
	 * Server is responsible for picking the right index per `sortColumn` (typically inside
	 * the `fetchOptimized` `where` builder).
	 */
	sortable?: boolean;
};

/** Direction value sent to the server when a sortable header is active. */
export type DataTableSortDirection = 'asc' | 'desc';

export type DataTableCellSnippetProps<T> = {
	row: T;
	column: ColumnDef<T>;
	value: unknown;
};

export type DataTableCustomCells<T> = Partial<
	Record<string, Snippet<[DataTableCellSnippetProps<T>]>>
>;

/** Tri-state header checkbox based on how many rows on the current page are selected. */
export type DataTableSelectionHeaderState = 'none' | 'some' | 'all';
