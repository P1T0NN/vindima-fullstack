<script lang="ts" generics="T">
	// COMPONENTS
	import DataTableItemsLoading from '@/components/ui/custom-components/data-table/data-table-items-loading.svelte';
	import InfiniteScroll from '@/components/ui/custom-components/infinite-scroll/infinite-scroll.svelte';
	import PaginatedData from '@/components/ui/custom-components/paginated-data/paginated-data.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { DataListProps } from '@/components/ui/custom-components/data-list/dataListTypes.js';
	import type {
		InfinitePaginationState,
		PaginationState
	} from '@/shared/features/pagination/types/paginationTypes.js';

	let {
		pagination,
		infiniteScrolling = false,
		total,
		placement = 'below',
		showPagination = true,
		header,
		empty,
		loadingSnippet,
		errorSnippet,
		key,
		children,
		class: className
	}: DataListProps<T> = $props();

	function isInfinitePaginationState(
		state: PaginationState<T> | InfinitePaginationState<T>
	): state is InfinitePaginationState<T> {
		return 'loadingMore' in state;
	}

	function isPagePaginationState(
		state: PaginationState<T> | InfinitePaginationState<T>
	): state is PaginationState<T> {
		return 'page' in state;
	}

	// Pagination state lives in the shared hook (features/pagination/hooks).
	// Read through the object (getters) — destructuring would snapshot it.
</script>

{#snippet list()}
	<ul class={cn('flex flex-col', className)}>
		{#each pagination.data as item, i (key ? key(item) : i)}
			<li>{@render children(item, i)}</li>
		{/each}
	</ul>
{/snippet}

{#if header}
	{@render header()}
{/if}

{#if infiniteScrolling && isInfinitePaginationState(pagination)}
	{#if pagination.error && pagination.data.length === 0}
		{@render errorSnippet?.(pagination.error)}
	{:else if pagination.loading && pagination.data.length === 0}
		{#if loadingSnippet}
			{@render loadingSnippet()}
		{:else}
			<DataTableItemsLoading />
		{/if}
	{:else if pagination.data.length > 0}
		<InfiniteScroll
			loading={pagination.loading}
			loadingMore={pagination.loadingMore}
			hasNextPage={pagination.hasNextPage}
			error={pagination.error}
			retry={pagination.retry}
			loadMore={pagination.loadMore}
		>
			{@render list()}
		</InfiniteScroll>
	{:else if empty}
		{@render empty()}
	{/if}
{:else if isPagePaginationState(pagination)}
	{#if showPagination && placement === 'above' && pagination.data.length > 0}
		<PaginatedData
			page={pagination.page}
			nextCursor={pagination.nextCursor}
			total={total ?? pagination.total}
			pageSize={pagination.pageSize}
			loading={pagination.loading}
			onPrev={pagination.onPrev}
			onNext={pagination.onNext}
		/>
	{/if}
	{#if pagination.error}
		{@render errorSnippet?.(pagination.error)}
	{:else if pagination.loading}
		{#if loadingSnippet}
			{@render loadingSnippet()}
		{:else}
			<DataTableItemsLoading />
		{/if}
	{:else if pagination.data.length > 0}
		{@render list()}
	{:else if empty}
		{@render empty()}
	{/if}
	{#if showPagination && placement === 'below' && pagination.data.length > 0}
		<PaginatedData
			page={pagination.page}
			nextCursor={pagination.nextCursor}
			total={total ?? pagination.total}
			pageSize={pagination.pageSize}
			loading={pagination.loading}
			onPrev={pagination.onPrev}
			onNext={pagination.onNext}
		/>
	{/if}
{/if}
