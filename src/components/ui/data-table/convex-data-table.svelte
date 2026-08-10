<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient, useQuery } from '@mmailaender/convex-svelte';
	import { toast } from 'svelte-sonner';

	// CONFIG
	import { PAGINATION_DATA, SEARCH_DATA } from '@/shared/config.js';

	// COMPONENTS
	import DataTable from './data-table.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/features/validations/utils/translateFromBackend';
	import { convexOneShotQuery } from '@/utils/convexOneShot.svelte.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		ColumnDef,
		DataTableCustomCells,
		DataTableOptimizationStrategy,
		DataTableSortDirection
	} from './types.js';
	import type { PaginatedListPayload } from '@/shared/features/pagination/types/paginationTypes';

	type ConvexPaginatedListQuery<T extends Record<string, unknown>> = FunctionReference<
		'query',
		'public',
		Record<string, unknown>,
		PaginatedListPayload<T>
	>;
	type ConvexDeleteMutation = FunctionReference<'mutation', 'public', { ids: string[] }, unknown>;

	type BackendMessage = Parameters<typeof translateFromBackend>[0];
	type MutationEnvelope = { success: boolean; message: BackendMessage };

	let {
		class: className,
		caption = '',
		query,
		queryArgs,
		columns,
		getRowId,
		customCells,
		optimizationStrategy = PAGINATION_DATA.DEFAULT_OPTIMIZATION_STRATEGY,
		pageSize = PAGINATION_DATA.DEFAULT_PAGE_SIZE,
		controlsPlace = 'bottom',
		selectable = false,
		selectedIds = $bindable<string[]>([]),
		deleteMutation,
		sortColumn = $bindable<string | undefined>(undefined),
		sortDirection = $bindable<DataTableSortDirection | undefined>(undefined),
		searchable = false,
		search = $bindable<string>(''),
		searchPlaceholder,
		searchArgName = 'search',
		searchDebounceMs = SEARCH_DATA.INPUT_DEBOUNCE_MS,
		filters,
		error,
		realtime = true,
		numbered
	}: {
		class?: string;
		caption?: string;
		query: ConvexPaginatedListQuery<T>;
		/**
		 * Extra args forwarded to the query alongside `paginationOpts` / `page`.
		 * Value changes reset the cursor stack because cursors are tied to a specific access spec.
		 */
		queryArgs?: Record<string, unknown>;
		columns: ColumnDef<T>[];
		/** Stable row id; required for selection to persist across pages. */
		getRowId?: (row: T) => string;
		customCells?: DataTableCustomCells<T>;
		/** Server access strategy. */
		optimizationStrategy?: DataTableOptimizationStrategy;
		/** Rows per page, sent via `paginationOpts.numItems`. */
		pageSize?: number;
		/** Where the pagination controls sit relative to the table. */
		controlsPlace?: 'top' | 'bottom';
		/** Turn the leftmost checkbox column on; multi-select, persists across pages. */
		selectable?: boolean;
		/** Two-way bound set of selected row ids (`bind:selectedIds`). */
		selectedIds?: string[];
		/**
		 * Convex mutation reference for bulk delete. Called via `safeMutation` with `{ ids }`.
		 */
		deleteMutation?: ConvexDeleteMutation;
		/** Active sort column id (matches `ColumnDef.id`). Bindable. */
		sortColumn?: string | undefined;
		/** Active sort direction. Bindable. */
		sortDirection?: DataTableSortDirection | undefined;
		/** Render a debounced search input above the table. */
		searchable?: boolean;
		/** Bindable, debounced search value. */
		search?: string;
		/** Placeholder for the search input. */
		searchPlaceholder?: string;
		/** Query arg name for the debounced search value. Defaults to `search`. */
		searchArgName?: string;
		/** Debounce window for the search input. Defaults to 300 ms. */
		searchDebounceMs?: number;
		/** Toolbar slot for arbitrary filter controls. */
		filters?: Snippet;
		/**
		 * Override the failure UI. Defaults to a shared `ErrorComponent` — a failed query must
		 * never fall through to the empty state, which would report a broken read as "no data".
		 */
		error?: Snippet;
		/**
		 * Hold a live subscription instead of fetching once per args change.
		 *
		 * ON by default here, unlike the template: every admin table in this app mutates rows
		 * from its own screen (bulk delete, status toggles, fulfillment) and relies on the
		 * subscription to reflect that write. Pass `realtime={false}` per table once you've
		 * confirmed nothing changes its rows under the viewer — that's the cheap path
		 * `docs/GeneralSystemDesignRule.md` wants, and it is one prop away.
		 *
		 * Read once at mount; do not toggle at runtime.
		 */
		realtime?: boolean;
		/** Clickable page numbers — see {@link DataTable}. Needs offset mode with an exact total. */
		numbered?: boolean;
	} = $props();

	const convex = useConvexClient();

	let page = $state(1);
	let cursorByPage = $state<Array<string | null>>([null]);

	const mergedQueryArgs = $derived.by<Record<string, unknown>>(() => {
		const base: Record<string, unknown> = { ...(queryArgs ?? {}) };
		if (sortColumn && sortDirection) {
			base.sortColumn = sortColumn;
			base.sortDirection = sortDirection;
		}
		if (searchable && search) {
			base[searchArgName] = search;
		}
		return base;
	});

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
				return {
					...extra,
					paginationOpts: { numItems: pageSize, cursor }
				};
			}
			case 'offset':
				return {
					...extra,
					page,
					paginationOpts: { numItems: pageSize, cursor: null }
				};
			default: {
				const _never: never = optimizationStrategy;
				return _never;
			}
		}
	}

	// Both return the same `{ data, error, isLoading }` surface, so nothing downstream branches
	// on which one is in play. `realtime` is read once here on purpose — swapping a subscription
	// for a one-shot mid-life would strand the open channel.
	// svelte-ignore state_referenced_locally
	const listQuery = realtime
		? useQuery(query, currentArgs, { keepPreviousData: true })
		: convexOneShotQuery(query, currentArgs, { keepPreviousData: true });

	const listPayload = $derived(listQuery.data as PaginatedListPayload<T> | undefined);

	const rows = $derived((listPayload?.page ?? []) as T[]);

	// `null` = the server declined to count (matched set past its scan cap). Distinct from
	// "no payload yet", which must leave the previous total alone rather than blanking the pager.
	let lastTotalCount = $state<number | null>(null);
	$effect(() => {
		if (optimizationStrategy !== 'offset') return;
		const n = listPayload?.totalCount;
		if (n === undefined) return;
		if (n !== lastTotalCount) lastTotalCount = n;
	});

	const totalPages = $derived(
		optimizationStrategy === 'offset' && typeof lastTotalCount === 'number'
			? Math.max(1, Math.ceil(lastTotalCount / pageSize))
			: undefined
	);

	$effect(() => {
		if (optimizationStrategy !== 'cursor' || !listPayload) return;
		if (listPayload.isDone) return;
		const next = listPayload.continueCursor;
		if (cursorByPage[page] !== next) {
			const copy = cursorByPage.slice();
			copy[page] = next;
			cursorByPage = copy;
		}
	});

	/**
	 * `isDone` is authoritative in both strategies, so this is not gated on `cursor` mode.
	 * Offset mode normally drives the next button from `totalPages`, but when the matched set
	 * exceeds the server's scan cap it returns `totalCount: null` and there are no page numbers
	 * to drive it — the paginator falls back to prev/next and needs this.
	 */
	const canGoNext = $derived(!!listPayload && !listPayload.isDone);

	$effect(() => {
		if (optimizationStrategy !== 'offset' || listPayload === undefined) return;
		// Only clamp against a total we actually have. Falling back to 1 here would yank the
		// user to page 1 the moment the matched set grew past the server's counting cap.
		if (totalPages !== undefined && page > totalPages) page = totalPages;
	});

	const tablePending = $derived(listPayload === undefined && listQuery.error === undefined);
	const queryLoadingForPagination = $derived(listQuery.isLoading && listPayload === undefined);

	function hasMutationEnvelope(value: unknown): value is MutationEnvelope {
		return (
			typeof value === 'object' &&
			value !== null &&
			'success' in value &&
			'message' in value &&
			typeof (value as { success: unknown }).success === 'boolean'
		);
	}

	async function deleteSelected(ids: string[]): Promise<boolean> {
		if (!deleteMutation) return false;

		const result = await safeMutation(convex, deleteMutation, { ids });
		if (!result) return false;
		if (!hasMutationEnvelope(result)) return true;

		toast[result.success ? 'success' : 'info'](translateFromBackend(result.message));
		return result.success;
	}
</script>

<DataTable
	class={className}
	{caption}
	data={rows}
	{columns}
	{getRowId}
	{customCells}
	{controlsPlace}
	{selectable}
	bind:selectedIds
	bind:sortColumn
	bind:sortDirection
	{searchable}
	bind:search
	{searchPlaceholder}
	{searchDebounceMs}
	{filters}
	bind:page
	{totalPages}
	{canGoNext}
	isLoading={tablePending}
	queryLoading={queryLoadingForPagination}
	hasResult={listPayload !== undefined}
	hasError={Boolean(listQuery.error)}
	error={error ?? defaultError}
	onDeleteSelected={deleteMutation ? deleteSelected : undefined}
	{numbered}
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
