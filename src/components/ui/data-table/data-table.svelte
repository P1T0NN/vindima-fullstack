<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES

	// COMPONENTS
	import DataTableContent from './data-table-content.svelte';
	import DataTableSelectedItemsStatus from './data-table-selected-items-status.svelte';
	import { PaginatedData } from '@/components/ui/paginated-data/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';

	// UTILS
	import { defaultRowKey } from './dataTableUtils.js';

	// CONFIG
	import { SEARCH_DATA } from '@/shared/config.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type {
		ColumnDef,
		DataTableCustomCells,
		DataTableSelectionHeaderState,
		DataTableSortDirection
	} from './types.js';

	type DeleteSelectedHandler = (ids: string[]) => boolean | void | Promise<boolean | void>;

	let {
		class: className,
		caption = '',
		data,
		columns,
		getRowId,
		customCells,
		controlsPlace = 'bottom',
		selectable = false,
		selectedIds = $bindable<string[]>([]),
		sortColumn = $bindable<string | undefined>(undefined),
		sortDirection = $bindable<DataTableSortDirection | undefined>(undefined),
		searchable = false,
		search = $bindable<string>(''),
		searchPlaceholder,
		searchDebounceMs = SEARCH_DATA.INPUT_DEBOUNCE_MS,
		filters,
		page = $bindable(1),
		totalPages,
		canGoNext = false,
		isLoading = false,
		queryLoading = false,
		hasResult = true,
		hasError = false,
		error,
		onDeleteSelected,
		pageHref,
		sortHref,
		numbered
	}: {
		class?: string;
		caption?: string;
		data: T[];
		columns: ColumnDef<T>[];
		/** Stable row id; required for selection to persist across pages. */
		getRowId?: (row: T) => string;
		customCells?: DataTableCustomCells<T>;
		/** Where the pagination controls sit relative to the table. */
		controlsPlace?: 'top' | 'bottom';
		/** Turn the leftmost checkbox column on; multi-select, persists across pages. */
		selectable?: boolean;
		/** Two-way bound set of selected row ids (`bind:selectedIds`). */
		selectedIds?: string[];
		/** Active sort column id (matches `ColumnDef.id`). Bindable. `undefined` = no sort. */
		sortColumn?: string | undefined;
		/** Active sort direction. Bindable. Cycle is `desc -> asc -> off`. */
		sortDirection?: DataTableSortDirection | undefined;
		/** Render a debounced search input above the table. */
		searchable?: boolean;
		/** Bindable, debounced search value. */
		search?: string;
		/** Placeholder for the search input. Falls back to a localized "Search..." string. */
		searchPlaceholder?: string;
		/** Debounce window for the search input. Defaults to 300 ms. */
		searchDebounceMs?: number;
		/** Toolbar slot for arbitrary filter controls. */
		filters?: Snippet;
		/** Current page. Bindable so callers can connect any backend or in-memory paginator. */
		page?: number;
		/** Exact total page count when known. Omit for cursor-style pagination. */
		totalPages?: number;
		/** Whether a cursor-style paginator can move forward. */
		canGoNext?: boolean;
		/** Loading state for the table body. */
		isLoading?: boolean;
		/** Loading state for pagination controls. */
		queryLoading?: boolean;
		/** Whether the paginator currently has a resolved result. */
		hasResult?: boolean;
		/**
		 * The query failed. Renders {@link error} in place of the rows and paginator — never
		 * the empty state, which would tell the user "no results" for what is actually a
		 * broken read.
		 */
		hasError?: boolean;
		/** What to render when {@link hasError}. `ConvexDataTable` supplies a default. */
		error?: Snippet;
		/** Optional bulk-delete handler. Return `false` to keep the current selection. */
		onDeleteSelected?: DeleteSelectedHandler;
		/**
		 * URL-driven pagination for server-rendered routes: `(p) => listHref(url, { page: p })`.
		 * Renders crawlable `<a href>` links and leaves `page` read-only — the route loader owns
		 * it. Omit on client-owned tables to keep the button paginator.
		 *
		 * NOTE: no URL-driven list route exists in this project yet — see
		 * `docs/GeneralSystemDesignRule.md § LIST & PAGINATION MECHANISMS`. The prop is wired
		 * so building one is a call-site change, not a component change.
		 */
		pageHref?: (page: number) => string;
		/**
		 * URL-driven sorting for server-rendered routes: `(id) => sortHref(url, id, activeSort)`.
		 * Sortable headers become real links, so the sort is bookmarkable and survives a reload.
		 * Without it, `sortColumn` / `sortDirection` are component state and vanish on refresh —
		 * fine for a live table, wrong for anything URL-driven.
		 */
		sortHref?: (columnId: string) => string;
		/**
		 * Render clickable page numbers in the paginator. Needs an exact `totalPages` — i.e.
		 * offset mode backed by an aggregate (or a set safely under the scan cap). Ignored in
		 * cursor mode, where there is no last page to number against.
		 */
		numbered?: boolean;
	} = $props();

	let searchDraft = $state(search);
	$effect(() => {
		if (!searchable) return;
		const next = searchDraft;
		const id = setTimeout(() => {
			search = next;
			page = 1;
		}, searchDebounceMs);
		return () => clearTimeout(id);
	});

	function onHeaderSort(columnId: string) {
		if (sortColumn !== columnId) {
			sortColumn = columnId;
			sortDirection = 'desc';
			page = 1;
			return;
		}
		if (sortDirection === 'desc') {
			sortDirection = 'asc';
			page = 1;
			return;
		}
		sortColumn = undefined;
		sortDirection = undefined;
		page = 1;
	}

	const isSearching = $derived(searchable && search.trim().length > 0);

	const sortableColumns = $derived(columns.filter((c) => c.sortable));

	const mobileSortValue = $derived(
		sortColumn && sortDirection ? `${sortColumn}:${sortDirection}` : ''
	);

	const mobileSortOptions = $derived([
		{ value: '', label: 'Orden predeterminado' },
		...sortableColumns.flatMap((col) => [
			{ value: `${col.id}:desc`, label: `${col.header} (desc)` },
			{ value: `${col.id}:asc`, label: `${col.header} (asc)` }
		])
	]);

	function onMobileSortChange(next: string) {
		if (!next) {
			sortColumn = undefined;
			sortDirection = undefined;
			page = 1;
			return;
		}
		const [col, dir] = next.split(':');
		if (!col || (dir !== 'asc' && dir !== 'desc')) return;
		sortColumn = col;
		sortDirection = dir;
		page = 1;
	}

	const selectedSet = $derived(new Set(selectedIds));

	const currentPageIds = $derived(
		data.map((row, index) => getRowId?.(row) ?? defaultRowKey(row, index))
	);

	const selectedOnPageCount = $derived(
		currentPageIds.reduce((n, id) => n + (selectedSet.has(id) ? 1 : 0), 0)
	);

	const headerSelectionState: DataTableSelectionHeaderState = $derived(
		currentPageIds.length === 0 || selectedOnPageCount === 0
			? 'none'
			: selectedOnPageCount === currentPageIds.length
				? 'all'
				: 'some'
	);

	function toggleRow(id: string) {
		if (selectedSet.has(id)) {
			selectedIds = selectedIds.filter((x) => x !== id);
		} else {
			selectedIds = [...selectedIds, id];
		}
	}

	function toggleAllOnPage() {
		if (currentPageIds.length === 0) return;

		if (headerSelectionState === 'all') {
			const pageIds = new Set(currentPageIds);
			selectedIds = selectedIds.filter((id) => !pageIds.has(id));
		} else {
			const existing = new Set(selectedIds);
			const next = selectedIds.slice();
			for (const id of currentPageIds) {
				if (!existing.has(id)) next.push(id);
			}
			selectedIds = next;
		}
	}

	let isDeleting = $state(false);

	async function runDelete() {
		if (!onDeleteSelected) return;

		const ids = selectedIds.slice();
		if (ids.length === 0) return;

		isDeleting = true;
		try {
			const result = await onDeleteSelected(ids);
			if (result !== false) selectedIds = [];
		} finally {
			isDeleting = false;
		}
	}
</script>

<div class="flex w-full flex-col gap-4">
	{#if searchable || sortableColumns.length > 0 || filters}
		<div class="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
			{#if searchable}
				<div class="relative w-full md:max-w-sm">
					<SearchIcon
						class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						bind:value={searchDraft}
						placeholder={searchPlaceholder ?? 'Buscar...'}
						aria-label={searchPlaceholder ?? 'Buscar...'}
						class="pl-9"
					/>
				</div>
			{/if}

			{#if filters}
				<div class="flex flex-wrap items-center gap-2">
					{@render filters()}
				</div>
			{/if}

			{#if sortableColumns.length > 0}
				<div class="md:hidden">
					<NativeSelect
						class="w-full"
						ariaLabel="Ordenar por"
						bind:value={() => mobileSortValue, onMobileSortChange}
						disabled={isSearching}
						options={mobileSortOptions}
					/>
				</div>
			{/if}
		</div>
	{/if}

	<!--
	  A failed query renders the error in place of rows + paginator. Falling through to the
	  table body would show the empty state ("Sin resultados"), which reports a broken read as
	  an empty dataset. The toolbar above stays mounted so filters/search remain adjustable.
	-->
	{#if hasError}
		{#if error}
			{@render error()}
		{/if}
	{:else}
		{#if controlsPlace === 'top'}
			<PaginatedData
				bind:page
				{totalPages}
				{canGoNext}
				{isLoading}
				{queryLoading}
				{hasResult}
				href={pageHref}
				{numbered}
			/>
		{/if}

		{#if selectable && selectedIds.length > 0}
			<DataTableSelectedItemsStatus
				count={selectedIds.length}
				onClear={() => {
					selectedIds = [];
				}}
				withActionButtons={onDeleteSelected !== undefined}
				deleteFunction={onDeleteSelected ? runDelete : undefined}
				{isDeleting}
			/>
		{/if}

		<DataTableContent
			class={className}
			{caption}
			{data}
			{columns}
			{getRowId}
			{isLoading}
			customCells={customCells ?? {}}
			{selectable}
			{selectedSet}
			{headerSelectionState}
			onToggleRow={toggleRow}
			onToggleAllOnPage={toggleAllOnPage}
			{sortColumn}
			{sortDirection}
			onSort={onHeaderSort}
			{sortHref}
			{isSearching}
		/>

		{#if controlsPlace === 'bottom'}
			<PaginatedData
				bind:page
				{totalPages}
				{canGoNext}
				{isLoading}
				{queryLoading}
				{hasResult}
				href={pageHref}
				{numbered}
			/>
		{/if}
	{/if}
</div>
