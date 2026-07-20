<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES

	// COMPONENTS
	import { Link } from '@/components/ui/link/index.js';
	import { TableCell, TableRow } from '@/components/ui/table/index.js';
	import { Checkbox } from '@/components/ui/checkbox/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { breakpointTableClass, formatCellValue } from './dataTableUtils.js';

	// TYPES
	import type { ColumnDef, DataTableCustomCells } from './types.js';

	let {
		row,
		columns,
		customCells,
		selectable = false,
		isSelected = false,
		onToggle
	}: {
		row: T;
		columns: ColumnDef<T>[];
		customCells?: DataTableCustomCells<T>;
		selectable?: boolean;
		isSelected?: boolean;
		onToggle?: () => void;
	} = $props();
</script>

<TableRow
	class={cn(
		'border-b transition-colors hover:bg-muted/30',
		isSelected && 'bg-muted/50 hover:bg-muted/60'
	)}
	aria-selected={selectable ? isSelected : undefined}
	data-state={selectable && isSelected ? 'selected' : undefined}
>
	{#if selectable}
		<TableCell class="w-10 px-4 py-3 align-middle">
			<Checkbox
				checked={isSelected}
				onCheckedChange={() => onToggle?.()}
				aria-label={isSelected ? 'Quitar selección de fila' : 'Seleccionar fila'}
			/>
		</TableCell>
	{/if}
	{#each columns as col (col.id)}
		{@const value = col.accessor(row)}
		<TableCell
			class={cn(
				'max-w-[16rem] px-4 py-3 whitespace-normal',
				breakpointTableClass(col.hideBelow),
				col.cellClass
			)}
		>
			<div class={cn('min-w-0', col.hasCopy && 'flex items-center gap-1.5')}>
				<div class={cn('min-w-0 flex-1', !col.wrap && 'truncate')}>
					{#if customCells?.[col.id]}
						{@render customCells[col.id]!({ row, column: col, value })}
					{:else if col.linkHref}
						<Link
							href={col.linkHref(row)}
							class={cn(
								'block font-medium text-primary underline-offset-2 hover:underline',
								!col.wrap && 'truncate'
							)}
							title={formatCellValue(value)}
						>
							{formatCellValue(value)}
						</Link>
					{:else}
						<span class={cn('block', !col.wrap && 'truncate')} title={formatCellValue(value)}>
							{formatCellValue(value)}
						</span>
					{/if}
				</div>
				{#if col.hasCopy}
					<CopyButton value={formatCellValue(value)} label={`Copy ${col.header}`} />
				{/if}
			</div>
		</TableCell>
	{/each}
</TableRow>
