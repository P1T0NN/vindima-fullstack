// SELECTION
// useSelectable: shared row-selection state behind any list/table harness
// (DataTable today). Owns a Set of selected keys — the `key` fn maps items to
// stable keys, index as fallback — and exposes `isSelected`/`toggle`/`clear`.
// Pass `key` as a getter (`() => key`) so a changing prop stays reactive;
// state is exposed through getters (destructuring would snapshot it).

// SVELTEKIT IMPORTS
import { SvelteSet } from 'svelte/reactivity';

// the shared API handed to row components (e.g. DataTableItem) — state lives
// in the hook instance, so every row reads/writes the same Set.
export type SelectableApi<T> = {
	readonly selectedKeys: SvelteSet<PropertyKey>;
	isSelected: (item: T, index: number) => boolean;
	toggle: (item: T, index: number) => void;
	clear: () => void;
};

export function useSelectable<T>(
	getKey: () => ((item: T) => PropertyKey) | undefined
): SelectableApi<T> {
	const selectedKeys = new SvelteSet<PropertyKey>();

	function keyOf(item: T, index: number) {
		const key = getKey();
		return key ? key(item) : index;
	}

	function isSelected(item: T, index: number) {
		return selectedKeys.has(keyOf(item, index));
	}

	function toggle(item: T, index: number) {
		const k = keyOf(item, index);
		if (selectedKeys.has(k)) {
			selectedKeys.delete(k);
		} else {
			selectedKeys.add(k);
		}
	}

	function clear() {
		selectedKeys.clear();
	}

	return {
		get selectedKeys() {
			return selectedKeys;
		},
		isSelected,
		toggle,
		clear
	};
}
