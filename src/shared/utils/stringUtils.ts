/** Capitalizes only the first character of a string. Returns the input unchanged when empty. */
export function capitalizeFirst(s: string): string {
	return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

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
