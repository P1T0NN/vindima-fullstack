/**
 * Resolve the admin form's `images` values to display URLs, preserving order (`[0]` = cover).
 *
 * The upload field submits storage references — `uploadedFiles` doc ids (Convex storage) or R2
 * keys — and both tables store the resolved `url`. Direct path/URL strings ('/assets/…',
 * 'https://…') pass through verbatim so scripted callers can still set images directly.
 * Unresolvable refs are dropped (never stored as broken image sources).
 */

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

export async function resolveImageUrls(ctx: QueryCtx, images: string[]): Promise<string[]> {
	const urls: string[] = [];
	for (const image of images) {
		const url = await resolveOne(ctx, image);
		if (url) urls.push(url);
	}
	return urls;
}

async function resolveOne(ctx: QueryCtx, image: string): Promise<string | null> {
	if (!image) return null;
	if (image.startsWith('/') || image.startsWith('http')) return image;

	const uploadedId = ctx.db.normalizeId('uploadedFiles', image);
	if (uploadedId) return (await ctx.db.get(uploadedId))?.url ?? null;

	const r2 = await ctx.db
		.query('uploadedFilesR2')
		.withIndex('by_key', (q) => q.eq('key', image))
		.unique();
	return r2?.url ?? null;
}
