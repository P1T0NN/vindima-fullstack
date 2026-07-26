<script lang="ts" module>
	// TYPES
	import type { SearchInputBaseProps, SearchInputItem, SearchInputResultPayload } from './types.js';
	import type { FunctionReference } from 'convex/server';

	// Accepts any query that returns rows: a full paginated list (`{ page, totalCount, … }`) or
	// the slim search payload (`{ page, isDone, continueCursor }`) — `mapSearchInputResults`
	// only reads `.page`.
	export type SearchListQuery<TRow extends Record<string, unknown> = Record<string, unknown>> =
		FunctionReference<'query', 'public', Record<string, unknown>, SearchInputResultPayload<TRow>>;

	export type SearchInputConvexProps<
		TRow extends Record<string, unknown> = Record<string, unknown>
	> = SearchInputBaseProps & {
		query: SearchListQuery<TRow>;
		mapItem?: (row: TRow) => SearchInputItem;
		queryArgs?: Record<string, unknown>;
		searchArgName?: string;
		searchDebounceMs?: number;
		includePaginationOpts?: boolean;
		getErrorMessage?: (error: unknown) => string;
	};
</script>

<script lang="ts" generics="TRow extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// COMPONENTS
	import SearchInput from './search-input.svelte';

	// UTILS
	import { getSearchInputErrorMessage, mapSearchInputResults } from './searchInputUtils.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		query,
		mapItem,
		queryArgs,
		searchArgName = 'search',
		searchDebounceMs = 300,
		maxResults = 5,
		minQueryLength = 1,
		includePaginationOpts = true,
		getErrorMessage = getSearchInputErrorMessage,
		...restProps
	}: SearchInputConvexProps<TRow> = $props();

	const convexClient = useConvexClient();

	let debouncedSearch = $state(value);
	let results = $state<SearchInputItem[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// The debounce means the typed term hasn't been searched yet, and `results` still holds the
	// previous term's rows (empty on the first keystrokes). Report that window as loading, so the
	// dropdown never flashes "no results" for a query that never ran — an empty state is only
	// honest once a request has come back.
	const awaitingDebounce = $derived(
		value.trim() !== debouncedSearch.trim() && value.trim().length >= minQueryLength
	);
	const isLoading = $derived(loading || awaitingDebounce);

	$effect(() => {
		const nextSearch = value;
		const timeout = setTimeout(() => {
			debouncedSearch = nextSearch;
		}, searchDebounceMs);

		return () => clearTimeout(timeout);
	});

	$effect(() => {
		const searchTerm = debouncedSearch.trim();

		if (searchTerm.length < minQueryLength) {
			results = [];
			loading = false;
			error = null;
			return;
		}

		const args = {
			...(queryArgs ?? {}),
			[searchArgName]: searchTerm,
			...(includePaginationOpts ? { paginationOpts: { numItems: maxResults, cursor: null } } : {})
		};

		loading = true;
		error = null;

		// One-shot per term (GeneralSystemDesignRule.md: search suggestions don't move under the
		// viewer, so no live subscription). A cancel guard drops stale resolutions when the term
		// changes before the request settles.
		let cancelled = false;
		convexClient
			.query(query, args)
			.then((data) => {
				if (cancelled) return;
				results = mapSearchInputResults(data, mapItem, maxResults);
				loading = false;
			})
			.catch((cause) => {
				if (cancelled) return;
				results = [];
				error = getErrorMessage(cause);
				loading = false;
			});

		return () => {
			cancelled = true;
		};
	});
</script>

<SearchInput
	bind:ref
	bind:value
	items={results}
	loading={isLoading}
	{error}
	{minQueryLength}
	{maxResults}
	{...restProps}
/>
