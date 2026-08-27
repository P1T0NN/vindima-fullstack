// LIBRARIES
import imageCompression from 'browser-image-compression';

// CONFIG
import { STORAGE_CLIENT_OPTIMIZE_CONFIG } from '@/shared/features/storage/config';

// TYPES
import type { ClientOptimizeOptions } from '@/shared/features/storage/types/storageTypes';

/**
 * Client-side image optimization — compress + re-encode to WebP in the browser.
 * Throws on failure; callers decide whether to abort or fall back to the original.
 */
export async function optimizeToWebp(
	file: File,
	options: ClientOptimizeOptions = {}
): Promise<File> {
	const { maxWidthOrHeight, maxSizeMB, quality } = {
		...STORAGE_CLIENT_OPTIMIZE_CONFIG,
		...options
	};

	const optimized = await imageCompression(file, {
		maxSizeMB,
		maxWidthOrHeight,
		initialQuality: quality,
		fileType: 'image/webp',
		useWebWorker: true
	});

	// browser-image-compression keeps the original name — drop the old extension
	const base = file.name.replace(/\.(jpe?g|png|gif|bmp|avif|webp)$/i, '');
	return new File([optimized], `${base || 'image'}.webp`, { type: 'image/webp' });
}
