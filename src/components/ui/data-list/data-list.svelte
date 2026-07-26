<script lang="ts" generics="T">
	// Presentational list shell: loading → empty → items, no data source attached. The Convex
	// twin (`convex-data-list`) owns fetching/pagination; this one renders whatever the caller
	// already has (one-shot fetches, store slices, static arrays).
	//
	// Items render BARE — the `item` snippet owns its own element — so callers keep full
	// control of semantics (e.g. `role="table"` container with `role="row"` items).

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		items,
		isLoading = false,
		item,
		empty,
		loading,
		header,
		class: className,
		role,
		ariaLabelledby,
		getItemKey
	}: {
		items: T[];
		/** Shows the `loading` snippet instead of the list while true. */
		isLoading?: boolean;
		/** Renders one item (bring your own element). */
		item: Snippet<[{ item: T; index: number }]>;
		/** Shown when `items` is empty (headers still render, so context survives). */
		empty?: Snippet;
		/** Shown while `isLoading`. */
		loading?: Snippet;
		/** Rendered once before the items (e.g. a column-header row). */
		header?: Snippet;
		class?: string;
		/** ARIA role for the container (e.g. `table` when items are `role="row"`). */
		role?: string;
		ariaLabelledby?: string;
		/** Stable key per item for the keyed `{#each}`. Defaults to the index. */
		getItemKey?: (item: T) => string;
	} = $props();
</script>

{#if isLoading}
	{@render loading?.()}
{:else}
	<div {role} aria-labelledby={ariaLabelledby} class={cn(className)}>
		{@render header?.()}

		{#each items as it, i (getItemKey ? getItemKey(it) : i)}
			{@render item({ item: it, index: i })}
		{:else}
			{@render empty?.()}
		{/each}
	</div>
{/if}
