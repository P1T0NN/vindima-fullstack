// UTILS
import { translateFromBackend, type TranslatableMessage } from '@/utils/translateFromBackend';

function descriptor(retryAfterMs: number | undefined): TranslatableMessage {
	if (typeof retryAfterMs !== 'number' || retryAfterMs <= 0) {
		return { key: 'GenericMessages.TOO_MANY_REQUESTS' };
	}
	if (retryAfterMs < 60_000) {
		return {
			key: 'GenericMessages.TOO_MANY_REQUESTS_SECONDS',
			params: { seconds: Math.ceil(retryAfterMs / 1000) }
		};
	}
	return {
		key: 'GenericMessages.TOO_MANY_REQUESTS_MINUTES',
		params: { minutes: Math.ceil(retryAfterMs / 60_000) }
	};
}

function parseDescriptor(raw: string): TranslatableMessage | null {
	if (!raw.startsWith('{')) return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (
			typeof parsed === 'object' &&
			parsed !== null &&
			typeof (parsed as TranslatableMessage).key === 'string'
		) {
			return parsed as TranslatableMessage;
		}
	} catch {
		/* plain string */
	}
	return null;
}

/**
 * Universal rate-limit message helper.
 *
 * - `rateLimitMessage(retryAfterMs?)` — localized UI copy (toasts, inline errors).
 * - `rateLimitMessage(rawError, fallback)` — localized copy; parses JSON from auth errors.
 *
 * Server-side wire JSON is built in {@link convexCreateRateLimit} (Convex cannot import Paraglide).
 */
export function rateLimitMessage(input?: number | string | null, second?: string): string {
	if (typeof input === 'string') {
		const parsed = parseDescriptor(input);
		if (parsed) return translateFromBackend(parsed);
		return input || second || '';
	}

	const ms = typeof input === 'number' ? input : undefined;
	return translateFromBackend(descriptor(ms));
}
