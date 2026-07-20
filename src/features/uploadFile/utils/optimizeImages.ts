/**
 * Client-side image compression → WebP via `browser-image-compression` (web worker).
 * Non-image files and SVG are returned unchanged. For Sharp, see `optimizeImages.server.ts`.
 */

// LIBRARIES
import imageCompression from 'browser-image-compression';

// TYPES
import type { Options as ImageCompressionOptions } from 'browser-image-compression';

/**
 * Defaults aligned with product image uploads (max ~1 MB, long edge 1920, WebP).
 *
 * `useWebWorker: false` is deliberate: when enabled, `browser-image-compression` spawns a
 * Blob-URL worker that `importScripts`-loads its own compiled bundle from `cdn.jsdelivr.net`,
 * which every reasonable CSP blocks. With the worker off, compression happens on the main
 * thread — a few hundred ms per image — no CDN, no CSP exception required.
 */
export const DEFAULT_IMAGE_COMPRESSION_OPTIONS: ImageCompressionOptions = {
	maxSizeMB: 1,
	maxWidthOrHeight: 1920,
	fileType: 'image/webp',
	useWebWorker: false
};

export type OptimizeImagesOptions = ImageCompressionOptions;

export interface ImageToUpload {
	file: File;
	alt?: string | null;
}

/** `overallOptimizePercent` is 0–100 across the whole optimize phase (all files). */
export type OptimizeImagesProgressCallback = (info: {
	overallOptimizePercent: number;
	fileIndex: number;
	totalFiles: number;
	fileCompressionPercent: number;
}) => void;

function isCompressibleImage(file: File): boolean {
	const t = file.type.toLowerCase();
	if (!t.startsWith('image/')) return false;
	if (t === 'image/svg+xml') return false;
	return true;
}

function mergeOptions(overrides?: OptimizeImagesOptions): ImageCompressionOptions {
	return { ...DEFAULT_IMAGE_COMPRESSION_OPTIONS, ...overrides };
}

async function runCompression(file: File, compressionOpts: ImageCompressionOptions): Promise<File> {
	if (typeof document === 'undefined') return file;
	if (!isCompressibleImage(file)) return file;

	try {
		return await imageCompression(file, compressionOpts);
	} catch {
		return file;
	}
}

export async function optimizeImage(file: File, options?: OptimizeImagesOptions): Promise<File> {
	return runCompression(file, mergeOptions(options));
}

export async function optimizeImages(
	files: File[],
	options?: OptimizeImagesOptions,
	onProgress?: OptimizeImagesProgressCallback
): Promise<File[]> {
	const n = files.length;
	if (n === 0) return [];

	if (!onProgress) {
		return Promise.all(files.map((f) => optimizeImage(f, options)));
	}

	const results: File[] = [];
	const baseOptions = mergeOptions(options);

	for (let i = 0; i < n; i++) {
		const f = files[i];
		onProgress({
			overallOptimizePercent: (i / n) * 100,
			fileIndex: i,
			totalFiles: n,
			fileCompressionPercent: 0
		});
		const compressionOpts: ImageCompressionOptions = {
			...baseOptions,
			onProgress: isCompressibleImage(f)
				? (p: number) => {
						onProgress({
							overallOptimizePercent: ((i + p / 100) / n) * 100,
							fileIndex: i,
							totalFiles: n,
							fileCompressionPercent: p
						});
					}
				: undefined
		};

		results.push(await runCompression(f, compressionOpts));

		onProgress({
			overallOptimizePercent: ((i + 1) / n) * 100,
			fileIndex: i,
			totalFiles: n,
			fileCompressionPercent: 100
		});
	}

	return results;
}

/** Same pattern as `useImageUpload`: preserve `alt` per entry. */
export async function optimizeImageUploads(
	images: ImageToUpload[],
	options?: OptimizeImagesOptions
): Promise<ImageToUpload[]> {
	return Promise.all(
		images.map(async (img) => ({
			file: await optimizeImage(img.file, options),
			alt: img.alt
		}))
	);
}
