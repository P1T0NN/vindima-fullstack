// SVELTEKIT IMPORTS
import { replaceState } from '$app/navigation';
import { page } from '$app/state';

/**
 * Universal URL search-params plumbing. `keys` are the params this hook
 * *owns*: `write` replaces only them and preserves every other param, the
 * pathname and the hash. Reading is unrestricted — `get`/`read` work for any
 * key. Callers keep their own `$state` (debounce, min-chars, mode) on top.
 *
 * `get(key)` — raw read (`string | null`, matches `URLSearchParams.get`).
 * `read(key)` — read with `''` fallback (the string url-mode state wants).
 * `write(values)` — `replaceState` the owned params (no-op whe unchanged).
 * `onPopState(cb)` — re-run `cb` on back/forward; returns the cnleanup.
 */
export function useSearchParams(keys: string[] = []) {
	const get = (key: string): string | null => page.url.searchParams.get(key);

	const read = (key: string): string => get(key) ?? '';

	function buildUrl(values: Record<string, string>): string {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const url = new URL(page.url);
		for (const key of keys) {
			url.searchParams.delete(key);
			const value = values[key];
			if (value) url.searchParams.set(key, value);
		}
		return `${url.pathname}${url.search}${url.hash}`;
	}

	function write(values: Record<string, string>): void {
		for (const key of keys) {
			if (read(key) !== (values[key] ?? '')) {
				// eslint-disable-next-line svelte/no-navigation-without-resolve
				replaceState(buildUrl(values), {});
				return;
			}
		}
	}

	function onPopState(callback: () => void): () => void {
		const handler = () => callback();
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}

	return { get, read, write, onPopState };
}
