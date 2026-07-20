<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES

	// COMPONENTS
	import DataTableContent from './data-table-content.svelte';
	import DataTableSelectedItemsStatus from './data-table-selected-items-status.svelte';
	import { PaginatedData } from '@/components/ui/paginated-data/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

	// UTILS
	import { defaultRowKey } from './dataTableUtils.js';

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
		searchDebounceMs = 300,
		filters,
		page = $bindable(1),
		totalPages,
		canGoNext = false,
		isLoading = false,
		queryLoading = false,
		hasResult = true,
		onDeleteSelected
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
		/** Optional bulk-delete handler. Return `false` to keep the current selection. */
		onDeleteSelected?: DeleteSelectedHandler;
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

	const activeSortLabel = $derived.by(() => {
		if (!sortColumn || !sortDirection) return null;
		const col = sortableColumns.find((c) => c.id === sortColumn);
		if (!col) return null;
		return { header: col.header, direction: sortDirection };
	});

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
		<div class="flex flex-col gap-2 md:flex-row md:items-center">
			{#if searchable}
				<div class="relative w-full md:max-w-sm">
					<SearchIcon
						class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						type="search"
						bind:value={searchDraft}
						placeholder={searchPlaceholder ?? 'Search…'}
						aria-label={searchPlaceholder ?? 'Search…'}
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
					<Select
						type="single"
						value={mobileSortValue}
						onValueChange={onMobileSortChange}
						disabled={isSearching}
					>
						<SelectTrigger class="w-full" aria-label="Sort by">
							<ArrowUpDownIcon class="size-4 opacity-70" aria-hidden="true" />
							<span class="truncate">
								{#if activeSortLabel}
									Sort by: {activeSortLabel.header}
									{activeSortLabel.direction === 'asc' ? '↑' : '↓'}
								{:else}
									Sort by
								{/if}
							</span>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">Default order</SelectItem>
							{#each sortableColumns as col (col.id)}
								<SelectItem value={`${col.id}:desc`}>{col.header} ↓</SelectItem>
								<SelectItem value={`${col.id}:asc`}>{col.header} ↑</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}
		</div>
	{/if}

	{#if controlsPlace === 'top'}
		<PaginatedData bind:page {totalPages} {canGoNext} {isLoading} {queryLoading} {hasResult} />
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
		{isSearching}
	/>

	{#if controlsPlace === 'bottom'}
		<PaginatedData bind:page {totalPages} {canGoNext} {isLoading} {queryLoading} {hasResult} />
	{/if}
</div>
