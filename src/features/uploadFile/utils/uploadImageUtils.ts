// The three questions every upload surface asks about one entry: is it already stored,
// what do we call it, and what is its stable identity. One implementation, so the item
// components, the dedup set and the preview map can never disagree.
//
// This project represents an already-uploaded image as its URL string (products embed URLs
// and `tables/products/helpers/resolveImageUrls` passes them through). The template's
// `{ key, url }` shape is the same idea with storage keys — swapping to it means editing
// this file plus `UploadFileEntry`, and nothing else. See `convex/helpers/resolveUploadedImages.ts`.

// TYPES
import type { UploadFileEntry } from '../types/uploadFileTypes';

/** True for an entry that is already in storage — nothing to optimize or upload. */
export function isExistingUploadImage(value: unknown): value is string {
	return typeof value === 'string';
}

/** Display name: the File's name, or the last path segment of a stored image's URL. */
export function uploadImageName(image: UploadFileEntry): string {
	if (image instanceof File) return image.name;
	return decodeURIComponent(image.split('/').pop()?.split('?')[0] ?? '') || 'Imagen';
}

/**
 * Stable identity for dedup and preview/list keys. Existing images key by their URL
 * (unique by construction); Files by name+size+mtime.
 */
export function uploadImageKey(image: UploadFileEntry): string {
	return image instanceof File ? `${image.name}-${image.size}-${image.lastModified}` : image;
}
