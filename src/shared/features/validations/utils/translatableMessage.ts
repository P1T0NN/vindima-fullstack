// Wire helpers for backend-emitted message CODES: a guard, a decoder for string-only
// channels, and the rate-limit descriptor shared by the Convex 429 hook and the client
// renderer. Dual-runtime — no i18n runtime, no Svelte, no DOM.
//
// Encoding is just `JSON.stringify(descriptor)` at the two call sites that need it
// (`mapDefaultValidationErrors`, `convexCreateRateLimit`) — no wrapper for a stdlib call.

// TYPES
import type { TranslatableMessage } from '../types/validationsTypes.js';

/**
 * Structural type guard for `ConvexError.data` payloads carrying a {@link TranslatableMessage}.
 * True for any object with `message: { key: string }` — code discriminators and extra
 * metadata are ignored.
 */
export function hasTranslatableMessage(data: unknown): data is { message: TranslatableMessage } {
	const msg = (data as { message?: { key?: unknown } } | null | undefined)?.message;
	return typeof msg?.key === 'string';
}

/**
 * Decode a string that may be a serialized descriptor (the inverse of `JSON.stringify`).
 * Returns `null` for plain text, so already-human strings pass through at the call site.
 */
export function parseTranslatableMessage(raw: string): TranslatableMessage | null {
	if (!raw.startsWith('{')) return null;
	try {
		const parsed = JSON.parse(raw) as TranslatableMessage | null;
		return typeof parsed?.key === 'string' ? parsed : null;
	} catch {
		return null; // human text that merely starts with '{'
	}
}

/**
 * Map a rate-limit `retryAfter` to its message code. THE single source for both runtimes —
 * the Convex hook serializes it onto the 429, the client renders it directly.
 */
export function rateLimitDescriptor(retryAfterMs?: number | null): TranslatableMessage {
	if (typeof retryAfterMs !== 'number' || retryAfterMs <= 0) {
		return { key: 'GenericMessages.TOO_MANY_REQUESTS' };
	}
	return retryAfterMs < 60_000
		? {
				key: 'GenericMessages.TOO_MANY_REQUESTS_SECONDS',
				params: { seconds: Math.ceil(retryAfterMs / 1000) }
			}
		: {
				key: 'GenericMessages.TOO_MANY_REQUESTS_MINUTES',
				params: { minutes: Math.ceil(retryAfterMs / 60_000) }
			};
}
