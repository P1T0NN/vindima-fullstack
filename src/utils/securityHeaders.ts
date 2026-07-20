/**
 * Security headers configuration and utilities.
 *
 * CSP is emitted by SvelteKit via `kit.csp` in `svelte.config.js` (nonce/hash
 * mode). The headers here are the ones SvelteKit doesn't manage.
 */

export function getSecurityHeaders(): Record<string, string> {
	return {
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
	};
}

/** HSTS — only set on HTTPS responses. */
export function getHstsHeader(): string {
	return 'max-age=31536000; includeSubDomains; preload';
}
