/**
 * Escape HTML entities to prevent XSS when interpolating user-supplied
 * strings into HTML contexts (email bodies, server-rendered markup, etc.).
 *
 * Covers the five critical characters: `&`, `<`, `>`, `"`, `'`.
 *
 * @example
 * ```ts
 * const safe = escapeHtml('<script>alert(1)</script>');
 * // => '&lt;script&gt;alert(1)&lt;/script&gt;'
 * ```
 */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}
