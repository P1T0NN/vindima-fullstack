// LIBRARIES
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';

/**
 * Canonical app path → SvelteKit href.
 * Use with `PAGE_ENDPOINTS` constants, e.g. `appHref(PROTECTED_PAGE_ENDPOINTS.ACCOUNT)`.
 * For dynamic segments: `appHref(ADMIN_PAGE_ENDPOINTS.USER.replace(':id', userId))`.
 */
export function appHref(href: string): string {
	// Canonical paths from PAGE_ENDPOINTS are not in SvelteKit's generated route union.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return resolve(href as any);
}

/** Navigate to a canonical app path. */
export function appGoto(href: string, opts?: Parameters<typeof goto>[1]) {
	return goto(appHref(href), opts);
}
