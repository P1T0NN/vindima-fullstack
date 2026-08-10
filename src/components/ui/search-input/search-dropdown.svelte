<script lang="ts">
	// COMPONENTS
	import SearchDropdownItem from './search-dropdown-item.svelte';
	import SearchEmpty from './search-empty.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { SearchDropdownProps } from './types.js';

	let {
		listboxId,
		inputId,
		items,
		activeIndex = $bindable(0),
		dropdownClass,
		loading = false,
		error = null,
		loadingText = 'Buscando...',
		emptyTitle,
		emptyDescription,
		pendingId = null,
		positionStyle,
		maxHeight,
		onActiveIndexChange,
		onSelect
	}: SearchDropdownProps = $props();

	let hasResults = $derived(items.length > 0);

	function handleActiveIndexChange(index: number) {
		activeIndex = index;
		onActiveIndexChange?.(index);
	}
</script>

<!-- Fixed, positioned by the field: a scrolling ancestor (dialog, panel) can't clip it. -->
<div
	class={cn(
		'fixed z-50 overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95',
		dropdownClass
	)}
	style={positionStyle}
	data-open
>
	{#if loading}
		<div class="px-3 py-6 text-center">
			<p class="text-sm text-muted-foreground">{loadingText}</p>
		</div>
	{:else if error}
		<div class="px-3 py-6 text-center">
			<p class="text-sm font-medium text-destructive">{error}</p>
		</div>
	{:else if hasResults}
		<ul
			id={listboxId}
			role="listbox"
			aria-label="Resultados"
			class="max-h-80 overflow-y-auto p-1"
			style={maxHeight ? `max-height:${maxHeight}px` : undefined}
		>
			{#each items as item, index (item.id)}
				<li role="presentation">
					<SearchDropdownItem
						{item}
						optionId={`${inputId}-option-${item.id}`}
						active={index === activeIndex}
						pending={pendingId === item.id}
						onHover={() => handleActiveIndexChange(index)}
						onSelect={() => onSelect(item)}
					/>
				</li>
			{/each}
		</ul>
	{:else}
		<SearchEmpty title={emptyTitle} description={emptyDescription} />
	{/if}
</div>
