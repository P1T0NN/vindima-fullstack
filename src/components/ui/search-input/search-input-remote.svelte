<script lang="ts" generics="TRow = SearchInputItem">
	// COMPONENTS
	import SearchInput from './search-input.svelte';

	// UTILS
	import { getSearchInputErrorMessage, mapSearchInputResults } from './searchInputUtils.js';

// CONFIG
import { SEARCH_DATA } from '@/shared/config.js';

	// TYPES
	import type {
		SearchInputItem,
		SearchInputRemoteProps,
		SearchInputResultPayload
	} from './types.js';

	let {
		ref = $bindable(null),
		value = $bindable(''),
		search,
		mapItem,
		searchDebounceMs = SEARCH_DATA.INPUT_DEBOUNCE_MS,
		maxResults = 5,
		// Server floor — `createSearchQuery` short-circuits shorter queries, so the client
		// gate must match it or every 1-char keystroke fires a pointless query.
		minQueryLength = SEARCH_DATA.MIN_QUERY_LENGTH,
		getErrorMessage = getSearchInputErrorMessage,
		...restProps
	}: SearchInputRemoteProps<TRow> = $props();

	let results = $state<SearchInputItem[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let requestVersion = 0;

	$effect(() => {
		const searchTerm = value.trim();
		requestVersion += 1;
		const version = requestVersion;

		if (searchTerm.length < minQueryLength) {
			results = [];
			loading = false;
			error = null;
			return;
		}

		loading = true;
		error = null;

		const timeout = setTimeout(() => {
			void search({ search: searchTerm, maxResults })
				.then((data: SearchInputResultPayload<TRow>) => {
					if (version !== requestVersion) return;

					results = mapSearchInputResults(data, mapItem, maxResults);
					loading = false;
				})
				.catch((cause: unknown) => {
					if (version !== requestVersion) return;

					results = [];
					error = getErrorMessage(cause);
					loading = false;
				});
		}, searchDebounceMs);

		return () => clearTimeout(timeout);
	});
</script>

<SearchInput
	bind:ref
	bind:value
	items={results}
	{loading}
	{error}
	{minQueryLength}
	{maxResults}
	{...restProps}
/>
