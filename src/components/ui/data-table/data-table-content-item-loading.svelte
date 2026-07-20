<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { TableCell, TableRow } from '@/components/ui/table/index.js';
	import { Card } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { breakpointTableClass } from './dataTableUtils.js';

	// TYPES
	import type { DataTableSkeletonColumn } from './types.js';

	type Variant = 'table' | 'mobile';

	let {
		variant,
		columns,
		rowCount = 6,
		selectable = false
	}: {
		variant: Variant;
		columns: DataTableSkeletonColumn[];
		rowCount?: number;
		selectable?: boolean;
	} = $props();

	const count = $derived(Math.max(1, Math.min(rowCount, 20)));
	const rowIndices = $derived(Array.from({ length: count }, (_, i) => i));
</script>

{#if variant === 'table'}
	{#each rowIndices as r (r)}
		<TableRow class="border-b hover:bg-muted/30">
			{#if selectable}
				<TableCell class="w-10 px-4 py-3 align-middle">
					<Skeleton class="h-4 w-4 rounded-[4px]" />
				</TableCell>
			{/if}
			{#each columns as col (col.id)}
				<TableCell
					class={cn(
						'max-w-[16rem] px-4 py-3 whitespace-normal',
						breakpointTableClass(col.hideBelow),
						col.cellClass
					)}
				>
					<Skeleton class="h-4 max-w-full rounded-sm sm:w-[70%]" />
				</TableCell>
			{/each}
		</TableRow>
	{/each}
{:else}
	{#each rowIndices as r (r)}
		<Card class="gap-0 px-4 py-4" role="listitem" aria-busy="true">
			{#if selectable}
				<div class="mb-3 flex items-center">
					<Skeleton class="h-4 w-4 rounded-[4px]" />
				</div>
			{/if}
			<dl class="flex flex-col gap-3">
				{#each columns as col (col.id)}
					<div class="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:gap-3">
						<dt
							class="text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:text-sm"
						>
							{col.header}
						</dt>
						<dd class="min-w-0">
							<Skeleton class="h-4 w-full max-w-56 rounded-sm" />
						</dd>
					</div>
				{/each}
			</dl>
		</Card>
	{/each}
{/if}
