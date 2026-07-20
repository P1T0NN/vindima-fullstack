<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import DataTable from './data-table.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/utils/translateFromBackend';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		ColumnDef,
		DataTableCustomCells,
		DataTableOptimizationStrategy,
		DataTableSortDirection,
		PaginatedListPayload
	} from './types.js';

	type ConvexPaginatedListQuery<T extends Record<string, unknown>> = FunctionReference<
		'query',
		'public',
		Record<string, unknown>,
		PaginatedListPayload<T>
	>;
	type ConvexDeleteMutation = FunctionReference<'mutation', 'public', { ids: string[] }, unknown>;

	type BackendMessage = Parameters<typeof translateFromBackend>[0];
	type MutationEnvelope = { success: boolean; message: BackendMessage };

	let {
		class: className,
		caption = '',
		query,
		queryArgs,
		columns,
		getRowId,
		customCells,
		optimizationStrategy = PAGINATION_DATA.DEFAULT_OPTIMIZATION_STRATEGY,
		pageSize = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		controlsPlace = 'bottom',
		selectable = false,
		selectedIds = $bindable<string[]>([]),
		deleteMutation,
		sortColumn = $bindable<string | undefined>(undefined),
		sortDirection = $bindable<DataTableSortDirection | undefined>(undefined),
		searchable = false,
		search = $bindable<string>(''),
		searchPlaceholder,
		searchArgName = 'search',
		searchDebounceMs = 300,
		filters
	}: {
		class?: string;
		caption?: string;
		query: ConvexPaginatedListQuery<T>;
		/**
		 * Extra args forwarded to the query alongside `paginationOpts` / `page`.
		 * Value changes reset the cursor stack because cursors are tied to a specific access spec.
		 */
		queryArgs?: Record<string, unknown>;
		columns: ColumnDef<T>[];
		/** Stable row id; required for selection to persist across pages. */
		getRowId?: (row: T) => string;
		customCells?: DataTableCustomCells<T>;
		/** Server access strategy. */
		optimizationStrategy?: DataTableOptimizationStrategy;
		/** Rows per page, sent via `paginationOpts.numItems`. */
		pageSize?: number;
		/** Where the pagination controls sit relative to the table. */
		controlsPlace?: 'top' | 'bottom';
		/** Turn the leftmost checkbox column on; multi-select, persists across pages. */
		selectable?: boolean;
		/** Two-way bound set of selected row ids (`bind:selectedIds`). */
		selectedIds?: string[];
		/**
		 * Convex mutation reference for bulk delete. Called via `safeMutation` with `{ ids }`.
		 */
		deleteMutation?: ConvexDeleteMutation;
		/** Active sort column id (matches `ColumnDef.id`). Bindable. */
		sortColumn?: string | undefined;
		/** Active sort direction. Bindable. */
		sortDirection?: DataTableSortDirection | undefined;
		/** Render a debounced search input above the table. */
		searchable?: boolean;
		/** Bindable, debounced search value. */
		search?: string;
		/** Placeholder for the search input. */
		searchPlaceholder?: string;
		/** Query arg name for the debounced search value. Defaults to `search`. */
		searchArgName?: string;
		/** Debounce window for the search input. Defaults to 300 ms. */
		searchDebounceMs?: number;
		/** Toolbar slot for arbitrary filter controls. */
		filters?: Snippet;
	} = $props();

	const convex = useConvexClient();

	let page = $state(1);
	let cursorByPage = $state<Array<string | null>>([null]);

	const mergedQueryArgs = $derived.by<Record<string, unknown>>(() => {
		const base: Record<string, unknown> = { ...(queryArgs ?? {}) };
		if (sortColumn && sortDirection) {
			base.sortColumn = sortColumn;
			base.sortDirection = sortDirection;
		}
		if (searchable && search) {
			base[searchArgName] = search;
		}
		return base;
	});

	const queryArgsKey = $derived(JSON.stringify(mergedQueryArgs));

	$effect(() => {
		void query;
		void queryArgsKey;
		cursorByPage = [null];
		page = 1;
	});

	// svelte-ignore state_referenced_locally
	const listQuery = useQuery(
		query,
		() => {
			const extra = mergedQueryArgs;
			switch (optimizationStrategy) {
				case 'cursor': {
					const cursor = cursorByPage[page - 1] ?? null;
					return {
						...extra,
						paginationOpts: { numItems: pageSize, cursor }
					};
				}
				case 'offset':
					return {
						...extra,
						page,
						paginationOpts: { numItems: pageSize, cursor: null }
					};
				default: {
					const _never: never = optimizationStrategy;
					return _never;
				}
			}
		},
		{ keepPreviousData: true }
	);

	const listPayload = $derived(listQuery.data as PaginatedListPayload<T> | undefined);

	const rows = $derived((listPayload?.page ?? []) as T[]);

	let lastTotalCount = $state(0);
	$effect(() => {
		if (optimizationStrategy !== 'offset') return;
		const n = listPayload?.totalCount;
		if (typeof n === 'number' && n !== lastTotalCount) lastTotalCount = n;
	});

	const totalPages = $derived(
		optimizationStrategy === 'offset'
			? Math.max(1, Math.ceil(lastTotalCount / pageSize))
			: undefined
	);

	$effect(() => {
		if (optimizationStrategy !== 'cursor' || !listPayload) return;
		if (listPayload.isDone) return;
		const next = listPayload.continueCursor;
		if (cursorByPage[page] !== next) {
			const copy = cursorByPage.slice();
			copy[page] = next;
			cursorByPage = copy;
		}
	});

	const canGoNext = $derived(
		optimizationStrategy === 'cursor' && !!listPayload && !listPayload.isDone
	);

	$effect(() => {
		if (optimizationStrategy !== 'offset' || listPayload === undefined) return;
		const max = totalPages ?? 1;
		if (page > max) page = max;
	});

	const tablePending = $derived(listPayload === undefined && listQuery.error === undefined);
	const queryLoadingForPagination = $derived(listQuery.isLoading && listPayload === undefined);

	function hasMutationEnvelope(value: unknown): value is MutationEnvelope {
		return (
			typeof value === 'object' &&
			value !== null &&
			'success' in value &&
			'message' in value &&
			typeof (value as { success: unknown }).success === 'boolean'
		);
	}

	async function deleteSelected(ids: string[]): Promise<boolean> {
		if (!deleteMutation) return false;

		const result = await safeMutation(convex, deleteMutation, { ids });
		if (!result) return false;
		if (!hasMutationEnvelope(result)) return true;

		toast[result.success ? 'success' : 'info'](translateFromBackend(result.message));
		return result.success;
	}
</script>

<DataTable
	class={className}
	{caption}
	data={rows}
	{columns}
	{getRowId}
	{customCells}
	{controlsPlace}
	{selectable}
	bind:selectedIds
	bind:sortColumn
	bind:sortDirection
	{searchable}
	bind:search
	{searchPlaceholder}
	{searchDebounceMs}
	{filters}
	bind:page
	{totalPages}
	{canGoNext}
	isLoading={tablePending}
	queryLoading={queryLoadingForPagination}
	hasResult={listPayload !== undefined}
	onDeleteSelected={deleteMutation ? deleteSelected : undefined}
/>
