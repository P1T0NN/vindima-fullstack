// UTILS
import { BACKEND_MESSAGES } from './backendMessages';

/**
 * Message descriptor emitted by the backend (Convex mutations/actions).
 *
 * The backend NEVER returns display text — only a stable key (+ optional params); the client
 * renders it via {@link BACKEND_MESSAGES}. Deliberately redeclared here rather than imported from
 * `@/convex/*` — the frontend utils must not depend on the Convex runtime. TypeScript is
 * structural, so any Convex return value shaped like this is accepted with no casting.
 *
 * Keep this definition in sync with `ConvexMutationResult['message']` on the backend.
 */
export type TranslatableMessage = {
	/** Stable message key, e.g. `"GenericMessages.DATA_TABLE_DELETED_ALL"`. */
	key: string;
	/** Serialisable interpolation params; must match the template placeholders. */
	params?: Record<string, string | number | boolean>;
};

/**
 * Resolve a backend-issued {@link TranslatableMessage} to display text.
 *
 * Single lookup + placeholder interpolation — no reactive state, no overhead. Unknown keys fall
 * back to the key literal (visible in dev), which is exactly what you want for missing-message
 * debugging.
 *
 * @example
 * const result = await safeMutation(client, api.foo.bar, args);
 * if (result) toast[result.success ? 'success' : 'error'](translateFromBackend(result.message));
 */
export function translateFromBackend(message: TranslatableMessage | string): string {
	const descriptor: TranslatableMessage = typeof message === 'string' ? { key: message } : message;
	const template = BACKEND_MESSAGES[descriptor.key];
	if (!template) return descriptor.key;
	return template.replace(/\{(\w+)\}/g, (match, param) =>
		descriptor.params && param in descriptor.params ? String(descriptor.params[param]) : match
	);
}

/**
 * Structural type guard for `ConvexError.data` payloads that carry a {@link TranslatableMessage}.
 * True for any object with a `message: { key: string; params?: ... }` — the code discriminator
 * and extra metadata our backend errors attach are ignored.
 *
 * Used by `safeMutation` / `safeAction` to auto-translate backend errors; exported for any
 * call site that wants to branch on it manually (e.g. show a dialog instead of a toast).
 */
export function hasTranslatableMessage(data: unknown): data is { message: TranslatableMessage } {
	if (typeof data !== 'object' || data === null || !('message' in data)) return false;
	const msg = (data as { message: unknown }).message;
	return (
		typeof msg === 'object' && msg !== null && typeof (msg as { key?: unknown }).key === 'string'
	);
}
