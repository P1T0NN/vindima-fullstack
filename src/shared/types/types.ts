// Cross-cutting shared types — dual-runtime (Convex and Svelte both import from here),
// so nothing in this file may reference an i18n runtime, Svelte, or the DOM.

// TYPES
import type { TranslatableMessage } from '@/shared/features/validations/types/validationsTypes';

/**
 * Shared return envelope for mutations/actions across the Convex backend.
 *
 * `success: false` is a soft outcome (e.g. "nothing to do", "not found", a validation message
 * the client should surface as-is). Genuine failures should still `throw` so Convex can roll
 * the transaction back; don't swallow errors just to stuff them into this shape.
 *
 * `message` is always a {@link TranslatableMessage} so the client can render it in the user's
 * current locale. `data` is optional and only meaningful on success paths.
 */
export type ConvexMutationResult<Data = undefined> = {
	success: boolean;
	message: TranslatableMessage;
	data?: Data;
};

/**
 * Base shape carried by typed `ConvexError`s thrown anywhere in the backend. Every
 * throw site should extend this (adding its own `code` discriminator + extra metadata) so
 * clients can always feed `err.data.message` straight into `translateFromBackend`.
 *
 * @example
 * throw new ConvexError({
 *   code: 'NOT_AUTHENTICATED',
 *   message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
 * } satisfies ConvexErrorPayload);
 */
export type ConvexErrorPayload = {
	code: string;
	message: TranslatableMessage;
};

// `FieldErrors` and `TranslatableMessage` live in
// `@/shared/features/validations/types/validationsTypes` — that file is their single
// source of truth; import them from there, never through this module.
