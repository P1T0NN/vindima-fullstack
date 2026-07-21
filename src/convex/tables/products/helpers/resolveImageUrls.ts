/**
 * Resolve the admin form's `images` values to display URLs, preserving order (`[0]` = cover).
 *
 * Per-entry resolution lives in the shared `resolveImageUrl` (upload refs → cached URL,
 * direct paths pass through). Unresolvable refs are dropped here rather than failing the
 * save — a product carries a list, so one bad entry shouldn't sink the rest.
 */

// HELPERS
import { resolveImageUrl } from '@/convex/storage/r2/resolveImageUrl';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

export async function resolveImageUrls(ctx: QueryCtx, images: string[]): Promise<string[]> {
	const urls: string[] = [];
	for (const image of images) {
		const url = await resolveImageUrl(ctx, image);
		if (url) urls.push(url);
	}
	return urls;
}
