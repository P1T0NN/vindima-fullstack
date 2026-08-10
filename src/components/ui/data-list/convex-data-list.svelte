<script lang="ts" generics="T">
	// LIBRARIES
	import { useQuery } from '@mmailaender/convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config.js';

	// COMPONENTS
	import DataList from './data-list.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { convexOneShotQuery } from '@/utils/convexOneShot.svelte.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type { DataListControlsPlace, DataListItemSnippetProps } from './types.js';
	import type { DataTableOptimizationStrategy } from '../data-table/types.js';
	import type { PaginatedListPayload } from '@/shared/features/pagination/types/paginationTypes';

	type ConvexPaginatedListQuery = FunctionReference<
		'query',
		'public',
		Record<string, unknown>,
		PaginatedListPayload<T>
	>;

	let {
		query,
		queryArgs,
		optimizationStrategy = PAGINATION_DATA.DEFAULT_OPTIMIZATION_STRATEGY,
		pageSize = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		item,
		empty,
		error,
		loading,
		header,
		class: className,
		role,
		ariaLabelledby,
		controlsPlace = 'bottom',
		getItemKey,
		realtime = true
	}: {
		/** A public Convex query returning `PaginatedListPayload<T>` (a `.paginate(...)` query). */
		query: ConvexPaginatedListQuery;
		/** Extra args merged alongside `paginationOpts`. A change resets to page 1 (cursors are
		 *  tied to the access spec). */
		queryArgs?: Record<string, unknown>;
		/** `cursor` (prev/next, O(page)) or `offset` (page numbers + exact total, capped scan). */
		optimizationStrategy?: DataTableOptimizationStrategy;
		/** Items per page, sent via `paginationOpts.numItems`. */
		pageSize?: number;
		/** Renders one item. */
		item: Snippet<[DataListItemSnippetProps<T>]>;
		/** Shown when the query resolves with zero items. */
		empty?: Snippet;
		/**
		 * Override the failure UI. Defaults to a shared `ErrorComponent` — a failed query must
		 * never fall through to the empty state, which would report a broken read as "no data".
		 */
		error?: Snippet;
		/** Shown while the first page loads. */
		loading?: Snippet;
		/** Rendered once before the items (e.g. a column-header row). */
		header?: Snippet;
		/** Extra classes on the list container. */
		class?: string;
		/** ARIA role for the container (e.g. `table` when items are `role="row"`). */
		role?: string;
		ariaLabelledby?: string;
		/** Where the pagination controls sit relative to the list. */
		controlsPlace?: DataListControlsPlace;
		/** Stable key per item for the keyed `{#each}`. Defaults to the index. */
		getItemKey?: (item: T, index: number) => string;
		/**
		 * Hold a live subscription instead of fetching once per args change. ON by default to
		 * preserve existing behaviour; pass `realtime={false}` per list once you've confirmed
		 * nothing changes its rows under the viewer — the cheap path
		 * `docs/GeneralSystemDesignRule.md` wants, one prop away.
		 *
		 * Read once at mount; do not toggle it at runtime.
		 */
		realtime?: boolean;
	} = $props();

	let page = $state(1);
	let cursorByPage = $state<Array<string | null>>([null]);

	const mergedQueryArgs = $derived(queryArgs ?? {});
	const queryArgsKey = $derived(JSON.stringify(mergedQueryArgs));

	$effect(() => {
		void query;
		void queryArgsKey;
		cursorByPage = [null];
		page = 1;
	});

	function currentArgs() {
		const extra = mergedQueryArgs;
		switch (optimizationStrategy) {
			case 'cursor': {
				const cursor = cursorByPage[page - 1] ?? null;
				return { ...extra, paginationOpts: { numItems: pageSize, cursor } };
			}
			case 'offset':
				return { ...extra, page, paginationOpts: { numItems: pageSize, cursor: null } };
			default: {
				const _never: never = optimizationStrategy;
				return _never;
			}
		}
	}

	// Same `{ data, error, isLoading }` surface either way, so nothing downstream branches on it.
	// `realtime` is read once on purpose — swapping mid-life would strand the open channel.
	// svelte-ignore state_referenced_locally
	const listQuery = realtime
		? useQuery(query, currentArgs, { keepPreviousData: true })
		: convexOneShotQuery(query, currentArgs, { keepPreviousData: true });

	const payload = $derived(listQuery.data as PaginatedListPayload<T> | undefined);
	const items = $derived((payload?.page ?? []) as T[]);

	// `null` = the server declined to count (matched set past its scan cap). Distinct from
	// "no payload yet", which must leave the previous total alone rather than blanking the pager.
	let lastTotalCount = $state<number | null>(null);
	$effect(() => {
		if (optimizationStrategy !== 'offset') return;
		const n = payload?.totalCount;
		if (n === undefined) return;
		if (n !== lastTotalCount) lastTotalCount = n;
	});

	const totalPages = $derived(
		optimizationStrategy === 'offset' && typeof lastTotalCount === 'number'
			? Math.max(1, Math.ceil(lastTotalCount / pageSize))
			: undefined
	);

	// Record the cursor that fetches the *next* page, so the Next button can advance.
	$effect(() => {
		if (optimizationStrategy !== 'cursor' || !payload || payload.isDone) return;
		const next = payload.continueCursor;
		if (cursorByPage[page] !== next) {
			const copy = cursorByPage.slice();
			copy[page] = next;
			cursorByPage = copy;
		}
	});

	$effect(() => {
		if (optimizationStrategy !== 'offset' || payload === undefined) return;
		// Only clamp against a total we actually have — see ConvexDataTable for why.
		if (totalPages !== undefined && page > totalPages) page = totalPages;
	});

	const hasError = $derived(Boolean(listQuery.error));
	const pending = $derived(payload === undefined && listQuery.error === undefined);
	const queryLoading = $derived(listQuery.isLoading && payload === undefined);

	/**
	 * `isDone` is authoritative in both strategies. Offset mode normally drives the next button
	 * from `totalPages`, but a matched set past the server's scan cap returns `totalCount: null`
	 * and the paginator falls back to prev/next, which needs this.
	 */
	const canGoNext = $derived(!!payload && !payload.isDone);

	// Only surface controls once paging is actually possible — a single-page list stays clean.
	const showPagination = $derived(
		!hasError && !pending && (totalPages !== undefined ? totalPages > 1 : page > 1 || canGoNext)
	);
</script>

<DataList
	{items}
	isLoading={pending}
	{hasError}
	{item}
	{empty}
	error={error ?? defaultError}
	{loading}
	{header}
	class={cn('flex flex-col gap-4', className)}
	{role}
	{ariaLabelledby}
	{getItemKey}
	bind:page
	{totalPages}
	{canGoNext}
	paginationIsLoading={pending}
	{queryLoading}
	hasResult={payload !== undefined}
	{showPagination}
	{controlsPlace}
/>

<!--
  Default failure UI, overridable via the `error` snippet. `onRetry` reloads instead of the
  button's `invalidateAll()` default: a Convex `useQuery` only re-subscribes when its args
  change or the component remounts, so `invalidateAll()` would do nothing.
-->
{#snippet defaultError()}
	<ErrorComponent
		variant="plain"
		title="No pudimos cargar los datos"
		description="Algo salió mal al cargar esta lista. Inténtalo de nuevo."
		retryLabel="Reintentar"
		onRetry={() => location.reload()}
	/>
{/snippet}
