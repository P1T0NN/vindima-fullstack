/**
 * Resolve ONE admin-form image value to a display URL — the shared piece behind every
 * table's image handling (products' `resolveImageUrls`, categories' card image).
 *
 * The upload field submits R2 object keys (`uploadedFilesR2` rows cache the resolved `url`).
 * Direct path/URL strings ('/assets/…', 'https://…') pass through verbatim so scripted
 * callers can set images directly. Returns `null` when the ref resolves to nothing — callers
 * decide whether that's "drop it" (products, which take a list) or a hard failure
 * (categories, where the single image is required).
 */

// HELPERS
import { r2 } from './r2';
import { buildR2PublicObjectUrl } from './buildR2PublicObjectUrl.js';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

export async function resolveImageUrl(ctx: QueryCtx, image: string): Promise<string | null> {
	if (!image) return null;
	if (image.startsWith('/') || image.startsWith('http')) return image;

	const row = await ctx.db
		.query('uploadedFilesR2')
		.withIndex('by_key', (q) => q.eq('key', image))
		.unique();
	if (!row) return null;

	if (row.url) return row.url;

	// `row.url` starts as '' — the scheduled `onSyncMetadata` action backfills it AFTER the
	// upload mutation returns, and a form submitted right after uploading beats that action.
	// Build the SAME permanent URL that backfill will write, so the value stored on the
	// product/category never expires. Without a public bucket only a signed URL exists;
	// it expires, but the backfill overwrites `uploadedFilesR2.url` moments later — the
	// copy already written to the entity row is the one that goes stale (see the warning
	// in `onSyncMetadata`).
	return buildR2PublicObjectUrl(row.key) ?? (await r2.getUrl(row.key, { expiresIn: 604800 }));
}
