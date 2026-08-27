<script lang="ts" generics="T">
	// COMPONENTS
	import { TableRow, TableCell } from '@/components/ui/table';
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { SelectableApi } from '@/hooks/useSelectable.svelte';

	let {
		item,
		index,
		selectable = false,
		selection,
		row
	}: {
		item: T;
		index: number;
		selectable?: boolean;
		selection: SelectableApi<T>;
		row: Snippet<[item: T, index: number]>;
	} = $props();

	// same accent as the checkbox/selection bar, derived from the primary token
	const selectedRowBackground = 'color-mix(in oklab, var(--primary) 14%, transparent)';

	// selection mode: once at least one row is checked, clicking anywhere on a
	// row toggles it. clicks on interactive elements inside the row are ignored.
	const selectionActive = $derived(selectable && selection.selectedKeys.size > 0);

	const onRowClick = (event: MouseEvent) => {
		if (!selectionActive) return;
		// SAFETY: the handler only fires on clicks on the row element, so
		// event.target is always a DOM Element here.
		if ((event.target as Element).closest('button, a, input, select, textarea, label')) return;
		selection.toggle(item, index);
	};
</script>

<TableRow
	class={selectionActive ? 'cursor-pointer' : undefined}
	style={selectable && selection.isSelected(item, index)
		? `background-color: ${selectedRowBackground}`
		: undefined}
	onclick={onRowClick}
>
	{#if selectable}
		<TableCell class="w-10">
			<Checkbox
				checked={selection.isSelected(item, index)}
				onCheckedChange={() => selection.toggle(item, index)}
				aria-label="Select row"
			/>
		</TableCell>
	{/if}
	{@render row(item, index)}
</TableRow>
