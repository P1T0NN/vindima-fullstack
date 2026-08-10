// SvelteKit-ingress half of the client-IP helpers. Split from the dual-runtime half
// (`@/shared/utils/clientAddress.ts`) because this one imports `@sveltejs/kit`, which
// Convex's isolate cannot resolve — and Convex genuinely needs `resolveAuthClientIp`.

// TYPES
import type { RequestEvent } from '@sveltejs/kit';

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
