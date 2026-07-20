/**
 * Locale-agnostic message descriptor: a Paraglide message key + its interpolation params.
 * The backend emits these; the frontend resolves them in whatever locale the user is in.
 *
 * `params` must be JSON-serialisable (it crosses the wire). Use only `string | number | boolean`.
 *
 * @example
 * // Backend:
 * return { success: true, message: { key: 'GenericMessages.DATA_TABLE_DELETED_ALL', params: { count: 3 } } };
 * // Frontend (see `translate()` helper):
 * toast.success(translate(result.message));
 */
export type TranslatableMessage = {
	key: string;
	params?: Record<string, string | number | boolean>;
};

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
 * Base shape carried by typed {@link ConvexError}s thrown anywhere in the backend. Every
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
