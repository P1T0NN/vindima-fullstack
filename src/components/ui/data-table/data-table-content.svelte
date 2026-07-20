<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES

	// COMPONENTS
	import DataTableEmpty from './data-table-empty.svelte';
	import DataTableContentItem from './data-table-content-item.svelte';
	import DataTableContentItemLoading from './data-table-content-item-loading.svelte';
	import DataTableContentItemMobile from './data-table-content-item-mobile.svelte';
	import {
		Table,
		TableBody,
		TableCaption,
		TableHead,
		TableHeader,
		TableRow
	} from '@/components/ui/table/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import { breakpointTableClass, defaultRowKey, showColumnInMobileCard } from './dataTableUtils.js';

	// TYPES
	import type { HTMLAttributes } from 'svelte/elements';
	import type {
		ColumnDef as ColumnDefT,
		DataTableCustomCells,
		DataTableSelectionHeaderState,
		DataTableSortDirection
	} from './types.js';

	type Props = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		data: T[];
		columns: ColumnDefT<T>[];
		caption?: string;
		getRowId?: (row: T) => string;
		isLoading?: boolean;
		customCells?: DataTableCustomCells<T>;
		selectable?: boolean;
		selectedSet?: Set<string>;
		headerSelectionState?: DataTableSelectionHeaderState;
		onToggleRow?: (id: string) => void;
		onToggleAllOnPage?: () => void;
		/** Active sort column id (matches `ColumnDef.id`); `undefined` = no sort applied. */
		sortColumn?: string | undefined;
		sortDirection?: DataTableSortDirection | undefined;
		/** Click handler for sortable headers. Called with the column id; parent owns the cycle. */
		onSort?: (columnId: string) => void;
		/**
		 * When `true`, sort affordances are suppressed: headers render as plain text and
		 * no chevrons are shown. Use when the server's current access pattern overrides
		 * any client sort — typically when a full-text search is active and Convex returns
		 * relevance-ordered rows.
		 */
		isSearching?: boolean;
	};

	let {
		data,
		columns,
		caption,
		getRowId,
		isLoading = false,
		customCells,
		class: className,
		selectable = false,
		selectedSet,
		headerSelectionState = 'none',
		onToggleRow,
		onToggleAllOnPage,
		sortColumn,
		sortDirection,
		onSort,
		isSearching = false,
		...restProps
	}: Props = $props();

	const mobileColumns = $derived(columns.filter(showColumnInMobileCard));

	function rowKey(row: T, index: number): string {
		return getRowId?.(row) ?? defaultRowKey(row, index);
	}
</script>

<div data-slot="data-table" class={cn('flex flex-col gap-0', className)} {...restProps}>
	{#if data.length === 0 && !isLoading}
		<DataTableEmpty />
	{:else}
		<Card
			class="hidden gap-0 py-0 md:flex md:flex-col"
			role="region"
			aria-busy={isLoading}
			aria-label={caption ?? 'Tabla de datos'}
		>
			<Table class="min-w-lg">
				{#if caption}
					<TableCaption
						class="mt-0 border-b px-4 py-3 text-left text-sm font-medium text-muted-foreground"
					>
						{caption}
					</TableCaption>
				{/if}
				<TableHeader>
					<TableRow class="border-b bg-muted/40 hover:bg-muted/40">
						{#if selectable}
							<TableHead scope="col" class="h-auto w-10 px-4 py-3 text-left text-muted-foreground">
								<Checkbox
									checked={headerSelectionState === 'all'}
									indeterminate={headerSelectionState === 'some'}
									disabled={isLoading || data.length === 0}
									onCheckedChange={() => onToggleAllOnPage?.()}
									aria-label="Seleccionar todas las filas de esta página"
								/>
							</TableHead>
						{/if}
						{#each columns as col (col.id)}
							{@const sortAffordance = !!col.sortable && !isSearching}
							{@const isActive = sortAffordance && sortColumn === col.id}
							{@const ariaSort = !sortAffordance
								? undefined
								: isActive
									? sortDirection === 'asc'
										? 'ascending'
										: 'descending'
									: 'none'}
							<TableHead
								scope="col"
								aria-sort={ariaSort}
								class={cn(
									'h-auto px-4 py-3 text-left text-xs font-semibold tracking-wide whitespace-normal text-muted-foreground uppercase',
									breakpointTableClass(col.hideBelow),
									col.headerClass
								)}
							>
								{#if sortAffordance && onSort}
									<button
										type="button"
										class={cn(
											'flex items-center gap-1.5 text-inherit transition-colors hover:text-foreground',
											isActive && 'text-foreground'
										)}
										onclick={() => onSort(col.id)}
									>
										<span>{col.header}</span>
										{#if isActive && sortDirection === 'asc'}
											<ChevronUpIcon class="size-3.5" aria-hidden="true" />
										{:else if isActive && sortDirection === 'desc'}
											<ChevronDownIcon class="size-3.5" aria-hidden="true" />
										{:else}
											<ChevronsUpDownIcon class="size-3.5 opacity-50" aria-hidden="true" />
										{/if}
									</button>
								{:else}
									{col.header}
								{/if}
							</TableHead>
						{/each}
					</TableRow>
				</TableHeader>

				<TableBody>
					{#if isLoading}
						<DataTableContentItemLoading variant="table" {columns} {selectable} />
					{:else}
						{#each data as row, rowIndex (rowKey(row, rowIndex))}
							{@const id = rowKey(row, rowIndex)}
							<DataTableContentItem
								{row}
								{columns}
								{customCells}
								{selectable}
								isSelected={selectedSet?.has(id) ?? false}
								onToggle={() => onToggleRow?.(id)}
							/>
						{/each}
					{/if}
				</TableBody>
			</Table>
		</Card>

		<!-- Mobile: stacked row cards -->
		<div class="flex flex-col gap-3 md:hidden" role="list" aria-label={caption ?? 'Filas de datos'}>
			{#if selectable && !isLoading && data.length > 0}
				<div class="flex items-center gap-2 px-1 py-1">
					<Checkbox
						checked={headerSelectionState === 'all'}
						indeterminate={headerSelectionState === 'some'}
						onCheckedChange={() => onToggleAllOnPage?.()}
						aria-label="Seleccionar todas las filas de esta página"
					/>
					<span class="text-xs font-medium text-muted-foreground">Seleccionar todo en la página</span>
				</div>
			{/if}
			{#if isLoading}
				<DataTableContentItemLoading variant="mobile" columns={mobileColumns} {selectable} />
			{:else}
				{#each data as row, rowIndex (rowKey(row, rowIndex))}
					{@const id = rowKey(row, rowIndex)}
					<DataTableContentItemMobile
						{row}
						columns={mobileColumns}
						{customCells}
						{selectable}
						isSelected={selectedSet?.has(id) ?? false}
						onToggle={() => onToggleRow?.(id)}
					/>
				{/each}
			{/if}
		</div>
	{/if}
</div>
