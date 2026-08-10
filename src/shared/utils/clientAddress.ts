// Dual-runtime half of the client-IP helpers: no SvelteKit, no DOM, no Node — Convex's
// isolate imports this (see `convex/auth/convexCreateAuthRateLimitHook.ts`). The
// SvelteKit-ingress half, which needs `RequestEvent`, lives in `@/utils/clientAddress.ts`.

/**
 * Custom header stamped by `src/routes/api/auth/[...all]/+server.ts` with the real client
 * IP. Must stay aligned with `advanced.ipAddress.ipAddressHeaders` in
 * `src/convex/auth/auth.ts`.
 */
export const CLIENT_IP_HEADER = 'x-client-ip' as const;

function readStampedClientIp(headers: Headers): string | null {
	const value = headers.get(CLIENT_IP_HEADER)?.trim();
	return value || null;
}

/**
 * Read the trusted client IP stamped by our SvelteKit auth proxy.
 *
 * Only reads {@link CLIENT_IP_HEADER}. Never falls back to `cf-connecting-ip`,
 * `x-forwarded-for`, or `x-real-ip` — on the Convex path those reflect the immediate hop
 * (e.g. Vercel egress), not the end user.
 */
export function resolveAuthClientIp(headers: Headers): string {
	return readStampedClientIp(headers) ?? 'unknown';
}
