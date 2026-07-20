// LIBRARIES
import { SvelteSet } from 'svelte/reactivity';

// TYPES
import type { UploadFileEntry, UploadFileRow } from '../types/uploadFileTypes';

export type UseFileUploadMode = 'single' | 'multiple';

export type UseFileUploadArgs = {
	mode: UseFileUploadMode;
	getFile: () => File | null;
	setFile: (f: File | null) => void;
	getFiles: () => UploadFileEntry[];
	setFiles: (f: UploadFileEntry[]) => void;
	getDisabled: () => boolean;
};

/**
 * Stable key for a list entry, used for dedup and preview map lookups. Existing-image
 * entries (strings) key by their URL/ref; Files by name+size+mtime.
 * Re-exported so sub-components can reference the same key logic.
 */
export function fileKey(f: UploadFileEntry): string {
	return typeof f === 'string' ? f : `${f.name}-${f.size}-${f.lastModified}`;
}

/**
 * Per-row key combining entry identity and positional index.
 */
export function previewKey(f: UploadFileEntry, index: number): string {
	return `${fileKey(f)}#${index}`;
}

/**
 * Composable encapsulating all shared state and event handling
 * for both single-file and multi-file upload modes.
 *
 * Use from `.svelte` / `.svelte.ts` with runes.
 */
export function useFileUpload(args: UseFileUploadArgs) {
	const { mode, getFile, setFile, getFiles, setFiles, getDisabled } = args;

	let inputRef = $state<HTMLInputElement | null>(null);
	let dragOver = $state(false);
	let previewUrls = $state<Record<string, string>>({});

	// --- derived -----------------------------------------------------------

	const displayList = $derived(
		mode === 'single'
			? ((f: File | null): UploadFileEntry[] => (f ? [f] : []))(getFile())
			: getFiles()
	);

	const isEmpty = $derived(mode === 'single' ? getFile() === null : getFiles().length === 0);

	const contentRows = $derived(
		displayList.map(
			(f, index): UploadFileRow => ({
				file: f,
				index,
				previewUrl: previewUrls[previewKey(f, index)] ?? null
			})
		)
	);

	// --- effects -----------------------------------------------------------

	$effect(() => {
		const list = displayList;
		const next: Record<string, string> = {};
		// Only object URLs created here need revoking — existing-image entries preview
		// with their own URL untouched.
		const created: string[] = [];
		list.forEach((f, index) => {
			if (typeof f === 'string') {
				next[previewKey(f, index)] = f;
			} else if (f.type.startsWith('image/')) {
				const url = URL.createObjectURL(f);
				next[previewKey(f, index)] = url;
				created.push(url);
			}
		});
		previewUrls = next;
		return () => {
			for (const u of created) URL.revokeObjectURL(u);
		};
	});

	$effect(() => {
		if (isEmpty && inputRef) inputRef.value = '';
	});

	// --- apply logic (differs by mode) -------------------------------------

	function applyPickedList(list: FileList | null) {
		if (!list?.length) return;

		if (mode === 'single') {
			setFile(list[0]);
			setFiles([]);
		} else {
			const existing = getFiles();
			const seen = new SvelteSet(existing.map(fileKey));
			const next = [...existing];

			for (const f of Array.from(list)) {
				const k = fileKey(f);
				if (seen.has(k)) continue;
				seen.add(k);
				next.push(f);
			}

			setFiles(next);
			setFile(null);
		}

		if (inputRef) inputRef.value = '';
	}

	// --- handlers ----------------------------------------------------------

	function handleInputChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		applyPickedList(input.files);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragOver = false;
		if (getDisabled()) return;
		const dropped = e.dataTransfer?.files;
		if (!dropped?.length) return;
		applyPickedList(dropped);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		if (!getDisabled() && e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
	}

	// --- public API --------------------------------------------------------

	return {
		get inputRef() {
			return inputRef;
		},
		set inputRef(v) {
			inputRef = v;
		},
		get dragOver() {
			return dragOver;
		},
		set dragOver(v) {
			dragOver = v;
		},
		get isEmpty() {
			return isEmpty;
		},
		get contentRows() {
			return contentRows;
		},
		handleInputChange,
		handleDrop,
		handleDragOver
	};
}
