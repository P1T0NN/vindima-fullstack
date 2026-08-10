// The layer that turns backend message CODES into words. Resolution table is
// `BACKEND_MESSAGES` (Spanish) — the single seam where an i18n runtime would be swapped in:
// replace the two `BACKEND_MESSAGES[...]` lookups below and every call site stays identical.

// HELPERS
import {
	parseTranslatableMessage,
	rateLimitDescriptor
} from '@/shared/features/validations/utils/translatableMessage.js';
import {
	BACKEND_MESSAGES,
	formatMessage
} from '@/shared/features/validations/data/backendMessages.js';

// TYPES
import type { TranslatableMessage } from '@/shared/features/validations/types/validationsTypes.js';

/**
 * Resolve a backend-issued {@link TranslatableMessage} to display text.
 *
 * Single lookup + single call — no reactive state, no overhead. Safe to call from event
 * handlers, render blocks, etc. Unknown keys fall back to the key literal (visible in dev),
 * which is exactly what you want for missing-message debugging.
 *
 * @example
 * const result = await safeMutation(client, api.foo.bar, args);
 * if (result) toast[result.success ? 'success' : 'error'](translateFromBackend(result.message));
 */
export function translateFromBackend(message: TranslatableMessage | string): string {
	const descriptor: TranslatableMessage = typeof message === 'string' ? { key: message } : message;
	const template = BACKEND_MESSAGES[descriptor.key];
	return template ? formatMessage(template, descriptor.params) : descriptor.key;
}

/**
 * Resolve a string that may be: a serialized `{ key, params }` descriptor (what the default
 * zod error map emits), a bare message key, or already-human text (bespoke schema messages)
 * — the last passes through unchanged because unknown keys fall back to the literal. Use for
 * any message whose origin you don't control.
 */
export function translateValidationMessage(raw: string): string {
	const parsed = parseTranslatableMessage(raw);
	return parsed ? translateFromBackend(parsed) : translateFromBackend(raw);
}

/**
 * Universal rate-limit message helper.
 *
 * - `rateLimitMessage(retryAfterMs?)` — display copy (toasts, inline errors).
 * - `rateLimitMessage(rawError, fallback)` — same; parses the serialized descriptor Better
 *   Auth errors carry in their message string.
 *
 * The retryAfter → code logic is the shared `rateLimitDescriptor`, the same source the
 * Convex hook serializes onto its 429 — nothing to keep in sync by hand.
 */
export function rateLimitMessage(input?: number | string | null, second?: string): string {
	if (typeof input === 'string') {
		const parsed = parseTranslatableMessage(input);
		if (parsed) return translateFromBackend(parsed);
		return input || second || '';
	}

	const ms = typeof input === 'number' ? input : undefined;
	return translateFromBackend(rateLimitDescriptor(ms));
}
