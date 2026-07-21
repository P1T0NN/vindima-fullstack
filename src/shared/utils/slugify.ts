/**
 * Display text → URL/identifier-safe slug. The one place slugs are shaped, shared by the
 * client and the Convex runtime so a name always produces the same identifier on both sides.
 */

/** Display text → lowercase kebab-case slug ('Cheese Boards' → 'cheese-boards').
 *  Non-Latin input can slugify to '' — callers treat that as missing. */
export function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/[\s_]+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');
}
