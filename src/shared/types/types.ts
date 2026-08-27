// Cross-cutting shared types — dual-runtime (Convex and Svelte both import from here),
// so nothing in this file may reference Svelte or the DOM.

/**
 * Shared return envelope for mutations/actions across the Convex backend.
 *
 * `success: false` is a soft outcome (e.g. "nothing to do", "not found", a validation message
 * the client should surface as-is). Genuine failures should still `throw` so Convex can roll
 * the transaction back; don't swallow errors just to stuff them into this shape.
 *
 * `message` is already display-ready text. `data` is optional and only meaningful on success
 * paths.
 */
export type ConvexMutationResult<Data = undefined> = {
	success: boolean;
	message: string;
	data?: Data;
};

/**
 * Base shape carried by typed `ConvexError`s thrown anywhere in the backend. Every
 * throw site should extend this (adding its own `code` discriminator + extra metadata) so
 * clients can surface `err.data.message` directly.
 *
 * @example
 * throw new ConvexError({
 *   code: 'NOT_AUTHENTICATED',
 *   message: 'Inicia sesión para continuar.'
 * } satisfies ConvexErrorPayload);
 */
export type ConvexErrorPayload = {
	code: string;
	message: string;
};

// `FieldErrors` lives in `@/shared/features/validations/types/validationsTypes`.
