// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

// HOOKS
import { useSearchParams } from '@/hooks/useSearchParams.svelte';

// TYPES
import type { SearchApi, SearchOptions } from '@/features/search/types/searchTypes.js';

/**
 * Shared search state behind any list/table search. Owns the raw input value,
 * debounce, min-chars gate and (in `url` mode) the URL search param. State is
 * returned as getters — destructuring would snapshot it.
 *
 * `value` is the live input; `term` is the debounced + trimmed value, or `''`
 * when below `minChars`. Bake `term` into the query and pass it as the
 * component's `search` prop so pagination reset and refetch stay in lockstep.
 *
 * Deliberately `$effect`-free: the debounce fires from the `value` setter (an
 * event handler), URL writes happen in the debounce callback, and external URL
 * changes (back/forward) are picked up via `useSearchParams.onPopState`.
 * `onMount` owns cleanup, so this must be called during component init (a
 * `<script>` block) — never in `<script module>` or at module scope.
 */
export function useSearch(options: SearchOptions = {}): SearchApi {
	const { mode = 'state', param = 'q', minChars = 2, debounceMs = 300 } = options;

	const { read, write, onPopState } = useSearchParams([param]);

	const initial = mode === 'url' ? read(param) : '';

	// `value` is the live input; `debounced` is what actually drives the query
	// (and, in url mode, the URL write). A pending debounce is cancelled by the
	// next keystroke — and by the `onMount` cleanup on unmount.
	let value = $state(initial);
	let debounced = $state(initial);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function schedule(v: string): void {
		clearTimeout(timer);
		timer = setTimeout(() => {
			debounced = v;
			if (mode === 'url') write({ [param]: v });
		}, debounceMs);
	}

	// External URL changes (back/forward, manual edit) sync straight into
	// `value` and `debounced` — no debounce delay on navigation.
	onMount(() => {
		let unsubscribe: (() => void) | undefined;
		if (mode === 'url') {
			unsubscribe = onPopState(() => {
				const fromUrl = read(param);
				if (fromUrl !== value) {
					value = fromUrl;
					debounced = fromUrl;
				}
			});
		}
		return () => {
			unsubscribe?.();
			clearTimeout(timer);
		};
	});

	const term = $derived(debounced.trim().length >= minChars ? debounced.trim() : '');

	return {
		get value() {
			return value;
		},
		set value(v: string) {
			value = v;
			schedule(v);
		},
		get term() {
			return term;
		},
		get isActive() {
			return term.length > 0;
		},
		clear() {
			value = '';
			schedule('');
		}
	};
}
