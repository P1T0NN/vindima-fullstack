// TYPES
import type { MutationCtx } from '../_generated/server';

export type ResolvedImage = { key: string; url: string };

/**
 * Resolves the ordered upload refs a MutationForm submits (R2 object keys) into
 * `{ key, url }` pairs by reading the cached `url` off the matching `uploadedFilesR2`
 * row. Embed the result on the domain document — order is preserved, so `images[0]`
 * stays the cover image and reads never touch storage.
 *
 * Refs whose upload row has vanished (deleted between upload and submit) are silently
 * dropped rather than failing the whole write.
 *
 * NOTE: the products module currently stores plain URL strings and resolves via
 * `tables/products/helpers/resolveImageUrls` (which also passes through direct URLs —
 * needed for edit flows that reorder existing images). Use THIS helper when a document
 * should embed `{ key, url }` pairs instead, e.g. to enable storage cleanup by key.
 */
export async function resolveUploadedImages(
	ctx: MutationCtx,
	refs: string[]
): Promise<ResolvedImage[]> {
	const resolved = await Promise.all(
		refs.map(async (ref) => {
			const row = await ctx.db
				.query('uploadedFilesR2')
				.withIndex('by_key', (q) => q.eq('key', ref))
				.unique();
			return row ? { key: ref, url: row.url } : null;
		})
	);
	return resolved.filter((r) => r !== null);
}
