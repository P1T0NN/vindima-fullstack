<script lang="ts">
	// COMPONENTS
	import SearchInput from './search-input.svelte';

	// UTILS
	import { filterSearchInputItems } from './searchInputUtils.js';

	// TYPES
	import type { SearchInputLocalProps } from './types.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		items,
		filter,
		maxResults = 5,
		minQueryLength = 1,
		...restProps
	}: SearchInputLocalProps = $props();

	let filteredItems = $derived(filterSearchInputItems(items, value, maxResults, filter));
</script>

<SearchInput
	bind:ref
	bind:value
	items={filteredItems}
	{minQueryLength}
	{maxResults}
	{...restProps}
/>
