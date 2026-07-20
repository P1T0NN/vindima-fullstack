// TYPES
import type { OptimizeImagesProgressCallback } from './optimizeImages';

export type UseProgressOptions = {
	/** Bar 0–`compressMax` during compression. Default `45`. */
	compressMax?: number;
	/** Bar ceiling during upload steps, before `markDone()` sets 100. Default `95`. */
	workMax?: number;
};

/**
 * Reusable progress state for multi-step flows (e.g. compress → upload each file).
 * Use from `.svelte` / `.svelte.ts` with runes.
 */
export function useProgress(options?: UseProgressOptions) {
	const compressMax = options?.compressMax ?? 45;
	const workMax = options?.workMax ?? 95;
	const uploadSpan = workMax - compressMax;

	let percent = $state(0);
	let label = $state('');

	function uploadSlicePercent(filesDone: number, totalFiles: number): number {
		if (totalFiles <= 0) return compressMax;
		return compressMax + (filesDone / totalFiles) * uploadSpan;
	}

	function start(message = 'Starting...') {
		percent = 0;
		label = message;
	}

	function clear() {
		percent = 0;
		label = '';
	}

	const setOptimizeProgress: OptimizeImagesProgressCallback = (info) => {
		const pct = (info.overallOptimizePercent / 100) * compressMax;
		percent = Math.min(workMax, Math.round(pct));
		label = `Compressing ${info.fileIndex + 1} / ${info.totalFiles} (${Math.round(info.fileCompressionPercent)}%)`;
	};

	function beforeUploadFile(fileNum: number, totalFiles: number) {
		percent = Math.round(uploadSlicePercent(fileNum - 1, totalFiles));
		label = `Uploading file ${fileNum} of ${totalFiles}…`;
	}

	function afterUploadFile(fileNum: number, totalFiles: number) {
		const pctOfFiles = Math.round((fileNum / totalFiles) * 100);
		percent = Math.min(workMax, Math.round(uploadSlicePercent(fileNum, totalFiles)));
		label = `${fileNum} of ${totalFiles} files uploaded (${pctOfFiles}%)`;
	}

	function markDone(doneLabel = 'Done') {
		percent = 100;
		label = doneLabel;
	}

	return {
		get percent() {
			return percent;
		},
		get label() {
			return label;
		},
		start,
		clear,
		setOptimizeProgress,
		beforeUploadFile,
		afterUploadFile,
		markDone,
		uploadSlicePercent
	};
}
