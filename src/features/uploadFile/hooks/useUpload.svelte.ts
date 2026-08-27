// TYPES
import type { PreviewFile } from '../types/uploadFileTypes.js';

type Bindable<T> = { get: () => T; set: (value: T) => void };

export function useUpload(options: {
	/**
	 * Allow multiple files. Without it, a new selection replaces the current one.
	 * Pass a function when the caller wants it read fresh (e.g. from a reactive prop).
	 */
	allowMultiple?: boolean | (() => boolean);
	/**
	 * Bridge to the caller's `$bindable` files — the hook drives it, the caller owns it,
	 * so parent `bind:` keeps working.
	 */
	files: Bindable<PreviewFile[]>;
}) {
	const { allowMultiple = false, files } = options;

	// read fresh every call — either a static boolean or a prop-refreshing closure
	const isMultiple = () => (allowMultiple instanceof Function ? allowMultiple() : allowMultiple);

	const toPreview = (file: File): PreviewFile => ({
		id: crypto.randomUUID(),
		file,
		url: URL.createObjectURL(file)
	});
	const revokePreview = (preview: PreviewFile) => {
		if (preview.file) URL.revokeObjectURL(preview.url);
	};

	const addFiles = (list: FileList | null) => {
		if (!list?.length) return;
		const next = Array.from(list).map(toPreview);
		if (!isMultiple()) {
			for (const file of files.get()) revokePreview(file);
			files.set(next.slice(0, 1));
		} else {
			files.set([...files.get(), ...next]);
		}
	};

	const remove = (index: number) => {
		const current = files.get();
		revokePreview(current[index]);
		files.set(current.filter((_, i) => i !== index));
	};

	const move = (index: number, direction: -1 | 1) => {
		const current = files.get();
		const target = index + direction;
		if (target < 0 || target >= current.length) return;
		const next = [...current];
		[next[index], next[target]] = [next[target], next[index]];
		files.set(next);
	};

	/** Promote the item at `index` to the front — the first item is the cover. */
	const setAsCover = (index: number) => {
		const current = files.get();
		if (index <= 0 || index >= current.length) return;
		const next = [...current];
		const [item] = next.splice(index, 1);
		files.set([item, ...next]);
	};

	/** Revoke all preview URLs — call from `onDestroy` (or before unmounting). */
	const destroy = () => {
		for (const file of files.get()) revokePreview(file);
	};

	return { addFiles, remove, move, setAsCover, destroy };
}
