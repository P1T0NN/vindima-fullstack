/**
 * Resolve a free `products.slug` for a new product, derived from its display name.
 *
 * Admins aren't developers and never type identifiers (same rule as `createCategory`), so
 * the create form is name-only and the slug is generated here. A name with no slug-able
 * characters (non-Latin input) falls back to a generic base; a taken slug gets a numeric
 * suffix, so two products may legitimately share a display name. Each pass is one indexed
 * `by_slug` lookup, and past the suffix cap it falls back to a timestamp — creation never
 * dead-ends on a name the admin would have to change by hand.
 */

// CONFIG
import { CATALOG_CONFIG } from '@/shared/config.js';

// UTILS
import { slugify } from '@/shared/utils/slugify';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

const { SLUG_FALLBACK_BASE, SLUG_SUFFIX_LIMIT } = CATALOG_CONFIG;

export async function getProductSlug(ctx: QueryCtx, name: string): Promise<string> {
	const base = slugify(name) || SLUG_FALLBACK_BASE;

	let slug = base;
	for (let suffix = 2; suffix <= SLUG_SUFFIX_LIMIT; suffix++) {
		if (!(await isTaken(ctx, slug))) return slug;
		// The timestamp branch is returned unchecked: unique in practice, and the loop ends here.
		slug = suffix === SLUG_SUFFIX_LIMIT ? `${base}-${Date.now()}` : `${base}-${suffix}`;
	}
	return slug;
}

async function isTaken(ctx: QueryCtx, slug: string): Promise<boolean> {
	const existing = await ctx.db
		.query('products')
		.withIndex('by_slug', (q) => q.eq('slug', slug))
		.unique();
	return existing !== null;
}
