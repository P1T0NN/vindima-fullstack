// One-shot migration: rewrite baked-in R2 image URLs from an old base to a new base
// (r2.dev → custom domain). Idempotent — only URLs that start with `from` are touched,
// so pasted external URLs are left alone and re-running is safe.
//
//   bunx convex run rewriteImageBaseUrl:rewriteImageBaseUrl \
//     '{"from":"https://pub-xxxx.r2.dev","to":"https://storage.vindimawinebar.com"}'
//
// Delete this file after running it on every deployment.

// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/functions';

const rewriteUrl = (url: string, from: string, to: string): string =>
	url.startsWith(from) ? to + url.slice(from.length) : url;

export const rewriteImageBaseUrl = internalMutation({
	args: { from: v.string(), to: v.string() },
	handler: async (ctx, args) => {
		const from = args.from.replace(/\/+$/, '');
		const to = args.to.replace(/\/+$/, '');

		let changed = 0;

		// products.images — storefront cover/card images (what you asked about).
		for (const row of await ctx.db.query('products').collect()) {
			const images = row.images.map((u) => rewriteUrl(u, from, to));
			if (images.some((u, i) => u !== row.images[i])) {
				await ctx.db.patch(row._id, { images });
				changed++;
			}
		}

		// productCategories.image + uploadedFilesR2.url hold the same baked URLs and would
		// otherwise stay broken — same one-line replace.
		for (const row of await ctx.db.query('productCategories').collect()) {
			if (row.image && row.image.startsWith(from)) {
				await ctx.db.patch(row._id, { image: rewriteUrl(row.image, from, to) });
				changed++;
			}
		}
		for (const row of await ctx.db.query('uploadedFilesR2').collect()) {
			if (row.url.startsWith(from)) {
				await ctx.db.patch(row._id, { url: rewriteUrl(row.url, from, to) });
				changed++;
			}
		}

		return { changed };
	}
});
