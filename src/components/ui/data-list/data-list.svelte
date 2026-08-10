<script lang="ts" generics="T">
	// Presentational list shell: error → loading → items/empty, no data source attached. The
	// Convex twin (`convex-data-list`) owns fetching/pagination; this one renders whatever the
	// caller already has (one-shot fetches, store slices, static arrays).
	//
	// Items render BARE — the `item` snippet owns its own element — so callers keep full
	// control of semantics (e.g. `role="table"` container with `role="row"` items).

	// COMPONENTS
	import PaginatedData from '@/components/ui/paginated-data/paginated-data.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { DataListControlsPlace, DataListItemSnippetProps } from './types.js';

	let {
		items,
		isLoading = false,
		hasError = false,
		item,
		empty,
		error,
		loading,
		header,
		class: className,
		role,
		ariaLabelledby,
		getItemKey,
		page = $bindable(1),
		totalPages,
		canGoNext = false,
		paginationIsLoading = false,
		queryLoading = false,
		hasResult = true,
		showPagination = false,
		controlsPlace = 'bottom',
		pageHref
	}: {
		items: T[];
		/** Shows the `loading` snippet instead of the list while true. */
		isLoading?: boolean;
		/**
		 * The read failed. Renders {@link error} instead of the list — never the empty state,
		 * which would report a broken read as "nothing here".
		 */
		hasError?: boolean;
		/** Renders one item (bring your own element). */
		item: Snippet<[DataListItemSnippetProps<T>]>;
		/** Shown when `items` is empty (headers still render, so context survives). */
		empty?: Snippet;
		/** Shown when {@link hasError}. `ConvexDataList` supplies a default. */
		error?: Snippet;
		/** Shown while `isLoading`. */
		loading?: Snippet;
		/** Rendered once before the items (e.g. a column-header row). */
		header?: Snippet;
		class?: string;
		/** ARIA role for the container (e.g. `table` when items are `role="row"`). */
		role?: string;
		ariaLabelledby?: string;
		/** Stable key per item for the keyed `{#each}`. Defaults to the index. */
		getItemKey?: (item: T, index: number) => string;
		/** 1-based page; bindable for parent-owned paginators. */
		page?: number;
		/** Offset mode: exact page count. Omit for cursor pagination. */
		totalPages?: number;
		/** Cursor mode: parent passes `!isDone` from the paginated payload. */
		canGoNext?: boolean;
		/** Loading state for the pagination label/buttons. */
		paginationIsLoading?: boolean;
		/** Query in flight (`PaginatedData.queryLoading`). */
		queryLoading?: boolean;
		/** Current read has a resolved list payload. */
		hasResult?: boolean;
		/** Render the paginator at all. Parents that own no pagination leave this off. */
		showPagination?: boolean;
		controlsPlace?: DataListControlsPlace;
		/**
		 * URL-driven pagination: `(p) => listHref(url, { page: p })`. Renders crawlable
		 * `<a href>` links and leaves `page` read-only. No URL-driven list route exists in this
		 * project yet — see `docs/GeneralSystemDesignRule.md § LIST & PAGINATION MECHANISMS`.
		 */
		pageHref?: (page: number) => string;
	} = $props();
</script>

{#snippet paginator()}
	<PaginatedData
		bind:page
		{totalPages}
		{canGoNext}
		isLoading={paginationIsLoading}
		{queryLoading}
		{hasResult}
		href={pageHref}
	/>
{/snippet}

<!--
  A failed read renders the error, never the empty state — "nothing here" is a wrong answer
  delivered confidently when the read is simply broken.
-->
{#if hasError}
	{@render error?.()}
{:else if isLoading}
	{@render loading?.()}
{:else}
	{#if showPagination && controlsPlace === 'top'}
		{@render paginator()}
	{/if}

	<div {role} aria-labelledby={ariaLabelledby} class={cn(className)}>
		{@render header?.()}

		{#each items as it, i (getItemKey ? getItemKey(it, i) : i)}
			{@render item({ item: it, index: i })}
		{:else}
			{@render empty?.()}
		{/each}
	</div>

	{#if showPagination && controlsPlace === 'bottom'}
		{@render paginator()}
	{/if}
{/if}
