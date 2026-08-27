/**
 * Resolve the admin form's `images` values to a usable URL list, preserving order
 * (`[0]` = cover).
 *
 * Images are stored as full public URLs at upload time, so this is a pure pass-through
 * filter: entries that are not a usable URL (`/`, `http://`, `https://`) are dropped rather
 * than failing the save — a product carries a list, so one bad entry shouldn't sink the rest.
 */

import { isUsableImageUrl } from '@/shared/utils/imageValue';

export function resolveImageUrls(images: string[]): string[] {
	return images.filter(isUsableImageUrl);
}
