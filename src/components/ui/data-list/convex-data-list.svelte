<script lang="ts" generics="T">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import PaginatedData from '@/components/ui/paginated-data/paginated-data.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type { PaginatedListPayload } from '@/components/ui/data-table/types.js';

	type ConvexPaginatedListQuery = FunctionReference<
		'query',
		'public',
		Record<string, unknown>,
		PaginatedListPayload<T>
	>;

	let {
		query,
		queryArgs,
		pageSize = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		item,
		empty,
		loading,
		class: className,
		controlsPlace = 'bottom',
		getItemKey
	}: {
		/** A public Convex query returning `PaginatedListPayload<T>` (a `.paginate(...)` query). */
		query: ConvexPaginatedListQuery;
		/** Extra args merged alongside `paginationOpts`. A change resets to page 1 (cursors are
		 *  tied to the access spec). */
		queryArgs?: Record<string, unknown>;
		/** Items per page, sent via `paginationOpts.numItems`. */
		pageSize?: number;
		/** Renders one item. */
		item: Snippet<[{ item: T; index: number }]>;
		/** Shown when the query resolves with zero items. */
		empty?: Snippet;
		/** Shown while the first page loads. */
		loading?: Snippet;
		/** Extra classes on the `<ul>`. */
		class?: string;
		/** Where the pagination controls sit relative to the list. */
		controlsPlace?: 'top' | 'bottom';
		/** Stable key per item for the keyed `{#each}`. Defaults to the index. */
		getItemKey?: (item: T) => string;
	} = $props();

	let page = $state(1);
	let cursorByPage = $state<Array<string | null>>([null]);

	const queryArgsKey = $derived(JSON.stringify(queryArgs ?? {}));
	$effect(() => {
		void query;
		void queryArgsKey;
		cursorByPage = [null];
		page = 1;
	});

	// svelte-ignore state_referenced_locally
	const listQuery = useQuery(
		query,
		() => ({
			...(queryArgs ?? {}),
			paginationOpts: { numItems: pageSize, cursor: cursorByPage[page - 1] ?? null }
		}),
		{ keepPreviousData: true }
	);

	const payload = $derived(listQuery.data as PaginatedListPayload<T> | undefined);
	const items = $derived((payload?.page ?? []) as T[]);

	// Record the cursor that fetches the *next* page, so the Next button can advance.
	$effect(() => {
		if (!payload || payload.isDone) return;
		const next = payload.continueCursor;
		if (cursorByPage[page] !== next) {
			const copy = cursorByPage.slice();
			copy[page] = next;
			cursorByPage = copy;
		}
	});

	const pending = $derived(payload === undefined && listQuery.error === undefined);
	const queryLoading = $derived(listQuery.isLoading && payload === undefined);
	const canGoNext = $derived(!!payload && !payload.isDone);
	// Only surface controls once paging is actually possible — a single-page list stays clean.
	const showControls = $derived(!pending && (page > 1 || canGoNext));
</script>

{#snippet controls()}
	{#if showControls}
		<PaginatedData
			bind:page
			{canGoNext}
			isLoading={pending}
			{queryLoading}
			hasResult={payload !== undefined}
		/>
	{/if}
{/snippet}

<div class="flex flex-col gap-6">
	{#if controlsPlace === 'top'}
		{@render controls()}
	{/if}

	{#if pending}
		{@render loading?.()}
	{:else if items.length === 0}
		{@render empty?.()}
	{:else}
		<ul class={cn('flex flex-col gap-4', className)}>
			{#each items as it, i (getItemKey ? getItemKey(it) : i)}
				<li>{@render item({ item: it, index: i })}</li>
			{/each}
		</ul>
	{/if}

	{#if controlsPlace === 'bottom'}
		{@render controls()}
	{/if}
</div>
