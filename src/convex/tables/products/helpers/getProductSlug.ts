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

// UTILS
import { slugify } from '@/shared/utils/slugify';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';

/** Base used when a name has no slug-able characters at all. */
const FALLBACK_BASE = 'producto';
/** Numeric suffixes tried before falling back to a timestamp. */
const SUFFIX_LIMIT = 50;

export async function getProductSlug(ctx: QueryCtx, name: string): Promise<string> {
	const base = slugify(name) || FALLBACK_BASE;

	let slug = base;
	for (let suffix = 2; suffix <= SUFFIX_LIMIT; suffix++) {
		if (!(await isTaken(ctx, slug))) return slug;
		// The timestamp branch is returned unchecked: unique in practice, and the loop ends here.
		slug = suffix === SUFFIX_LIMIT ? `${base}-${Date.now()}` : `${base}-${suffix}`;
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
