// SVELTEKIT IMPORTS
import { onMount } from 'svelte';

// HOOKS
import { useSearchParams } from '@/hooks/useSearchParams.svelte';

// TYPES
import type {
	ActiveFilters,
	FiltersApi,
	FiltersOptions
} from '@/shared/features/filters/types/filterTypes.js';

/**
 * Shared filter state behind any list/table filter bar. Owns the selected
 * value per `def.key` (defaulting to `''` = the "All" sentinel) and, in `url`
 * mode, one search param per active filter. State is returned as getters —
 * destructuring would snapshot it.
 *
 * `value(key)` is the selected value; `active`/`count`/`isActive`/`identity`
 * derive from it. Bake `identity` into the query and pass it as the component's
 * `filters` prop so pagination reset and refetch stay in lockstep.
 *
 * Deliberately `$effect`-free and debounce-free: select changes are discrete,
 * so `set` writes the URL immediately; external URL changes (back/forward) are
 * picked up via `useSearchParams.onPopState`, and `onMount` owns cleanup — so
 * this must be called during component init (a `<script>` block), never in
 * `<script module>` or at module scope.
 */
export function useFilters(options: FiltersOptions): FiltersApi {
	const { mode = 'state', defs } = options;

	const keys = defs.map((d) => d.key);
	const { read, write, onPopState } = useSearchParams(keys);

	// Seed from the URL in `url` mode; all-inactive in `state` mode.
	const initial = () => {
		const state: Record<string, string> = {};
		for (const def of defs) {
			state[def.key] = mode === 'url' ? read(def.key) : '';
		}
		return state;
	};

	let values = $state(initial());

	function writeUrl(): void {
		if (mode === 'url') write(values);
	}

	// External URL changes (back/forward, manual edit) sync straight into state.
	onMount(() => {
		if (mode !== 'url') return;
		return onPopState(() => {
			const next = { ...values };
			let changed = false;
			for (const def of defs) {
				const fromUrl = read(def.key);
				if (fromUrl !== next[def.key]) {
					next[def.key] = fromUrl;
					changed = true;
				}
			}
			if (changed) values = next;
		});
	});

	const active = $derived.by(() => {
		const result: ActiveFilters = {};
		for (const [key, value] of Object.entries(values)) {
			if (value) result[key] = value;
		}
		return result;
	});

	const count = $derived(Object.keys(active).length);
	const isActive = $derived(count > 0);
	// Canonical, order-independent serialization — sorted keys so `{status,price}`
	// and `{price,status}` produce the same reset/cache key.
	const identity = $derived(
		Object.entries(active)
			.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
			.map(([key, value]) => `${key}=${value}`)
			.join('\u0000')
	);

	return {
		defs,
		value(key: string) {
			return values[key] ?? '';
		},
		set(key: string, value: string) {
			values = { ...values, [key]: value };
			writeUrl();
		},
		get active() {
			return active;
		},
		get count() {
			return count;
		},
		get isActive() {
			return isActive;
		},
		get identity() {
			return identity;
		},
		clear(key: string) {
			values = { ...values, [key]: '' };
			writeUrl();
		},
		clearAll() {
			const cleared: Record<string, string> = {};
			for (const def of defs) cleared[def.key] = '';
			values = cleared;
			writeUrl();
		}
	};
}
