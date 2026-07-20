// TYPES
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Custom header stamped by {@link ../routes/api/auth/[...all]/+server.ts} with the
 * real client IP. Must stay aligned with `advanced.ipAddress.ipAddressHeaders` in
 * `src/convex/auth/auth.ts`.
 */
export const CLIENT_IP_HEADER = 'x-client-ip' as const;

export type ResolveClientAddressOptions = {
	/**
	 * Value when {@link RequestEvent.getClientAddress} cannot resolve an address.
	 * When omitted, uses `127.0.0.1` in dev and `null` in production.
	 */
	fallback?: string | null;
	/**
	 * When true (default), falls back to `127.0.0.1` in dev when the adapter cannot resolve.
	 */
	devFallback?: boolean;
};

type ClientAddressEvent = Pick<RequestEvent, 'getClientAddress'>;

function readStampedClientIp(headers: Headers): string | null {
	const value = headers.get(CLIENT_IP_HEADER)?.trim();
	return value || null;
}

/**
 * Read the trusted client IP stamped by our SvelteKit auth proxy.
 *
 * Only reads {@link CLIENT_IP_HEADER}. Never falls back to `cf-connecting-ip`,
 * `x-forwarded-for`, or `x-real-ip` — on the Convex path those reflect the
 * immediate hop (e.g. Vercel egress), not the end user.
 */
export function resolveAuthClientIp(headers: Headers): string {
	return readStampedClientIp(headers) ?? 'unknown';
}

/**
 * Resolve the real end-user IP for SvelteKit ingress (remote functions, auth proxy).
 *
 * Uses only {@link RequestEvent.getClientAddress} — on Vercel this reads the
 * platform-trusted client address from the edge, not client-controlled headers.
 *
 * We intentionally do **not** parse `x-forwarded-for`, `cf-connecting-ip`, or
 * `x-real-ip` here: they can be spoofed on direct browser requests, and on
 * server-to-server hops they often contain a proxy/server IP instead of the user.
 */
export function resolveClientAddress(
	event: ClientAddressEvent,
	options?: ResolveClientAddressOptions
): string | null {
	try {
		const address = event.getClientAddress()?.trim();
		if (address) return address;
	} catch {
		// Some adapters cannot resolve a client address during prerender or locally.
	}

	const isDev = process.env.NODE_ENV === 'development';
	const devFallback = options?.devFallback !== false && isDev ? '127.0.0.1' : null;
	const fallback = options?.fallback !== undefined ? options.fallback : devFallback;

	return fallback;
}
