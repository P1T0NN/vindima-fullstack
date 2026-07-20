/**
 * Convex Helper Functions
 *
 * Why we use safeMutation/safeAction instead of useMutation/useAction:
 *
 * 1. convex-svelte doesn't provide useMutation/useAction hooks - only useQuery exists
 *
 * 2. Mutations and actions are fundamentally different from queries:
 *    - Queries are SUBSCRIPTIONS (real-time, reactive) - they need hooks like useQuery
 *    - Mutations/actions are ONE-OFF CALLS (fire and forget) - they're imperative, not reactive
 *
 * 3. The real-time reactivity comes from useQuery(), which automatically updates
 *    when data changes. When you call a mutation, any useQuery subscriptions
 *    watching that data will automatically receive the updates.
 *
 * Usage pattern:
 *   - useQuery() for reading data (reactive, real-time)
 *   - safeMutation()/safeAction() for writing data (imperative, with error handling)
 */

// LIBRARIES
import { toast } from 'svelte-sonner';
import { ConvexError } from 'convex/values';
import { isRateLimitError } from '@convex-dev/rate-limiter';
import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';
import { hasTranslatableMessage, translateFromBackend } from '@/utils/translateFromBackend';

// TYPES
import type { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';
import type { ConvexClient } from 'convex/browser';

// CONFIG
import { api } from '@/convex/_generated/api';

/**
 * Upload a browser `File` to Cloudflare R2 (via `@convex-dev/r2`):
 *   1. `generateR2UploadUrl` mints a signed URL + object key (auth-checked before mint).
 *   2. The browser PUTs the file directly to R2.
 *   3. `syncMetadata` triggers the server `onUpload` hook, which charges the rate limit,
 *      validates size/MIME against R2's HEAD metadata, and inserts the `uploadedFilesR2` row.
 *
 * Both Convex calls go through {@link safeMutation}, so typed backend errors become
 * translated toasts and a `null` return. The intermediate R2 PUT is a raw `fetch`; on failure
 * we toast the generic upload-failed copy and return `null`.
 *
 * @returns the R2 object `key` on success (the row's stable identifier in `uploadedFilesR2`),
 *          or `null` when an error was already toasted.
 */
export async function uploadFileToR2(client: ConvexClient, file: File): Promise<string | null> {
	const minted = await safeMutation(client, api.storage.r2.r2.generateR2UploadUrl, {});
	if (!minted || !minted.success || !minted.data) return null;

	const { url, key } = minted.data;

	try {
		const res = await fetch(url, { method: 'PUT', body: file });
		if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
	} catch (error) {
		console.error('[uploadFileToR2] R2 PUT failed', error);
		toast.error('No se pudo guardar el archivo subido. Inténtalo de nuevo.');
		return null;
	}

	// Can't use `safeMutation` here: `syncMetadata` is declared `returns: v.null()`, so its
	// success value collides with `safeMutation`'s null-on-handled-error sentinel. Inline the
	// try/catch and reuse `handleConvexError` to keep the toast behaviour consistent.
	try {
		await client.mutation(api.storage.r2.r2.syncMetadata, { key });
	} catch (error) {
		if (handleConvexError(error)) return null;
		throw error;
	}

	return key;
}

/**
 * Centralised error-to-toast handling shared by `safeMutation` and `safeAction`.
 *
 * Returns `true` if the error was handled (caller should resolve with `null`), `false`
 * if the caller should rethrow. Three branches, in order of specificity:
 *
 *   1. Rate-limit errors → `TOO_MANY_REQUESTS_*` toast with the actual `retryAfter`
 *      surfaced (seconds for short waits, minutes for long ones). These are emitted by
 *      the `@convex-dev/rate-limiter` library and have their own detection helper.
 *   2. Typed backend errors (`ConvexError` whose `data` carries a `TranslatableMessage`)
 *      → translate + toast. This covers every throw from `createDeleteMutation`,
 *      `requireAdmin`, `storageMutations`, etc. — they all share `ConvexErrorPayload`.
 *   3. Anything else → NOT handled. Rethrown to the caller so untyped throws and
 *      genuine programming errors surface loudly in dev and hit error boundaries in
 *      prod. Converting them to silent toasts would hide bugs.
 */
export function handleConvexError(error: unknown): boolean {
	if (isRateLimitError(error)) {
		toast.error(rateLimitMessage(error.data.retryAfter));
		return true;
	}
	if (error instanceof ConvexError && hasTranslatableMessage(error.data)) {
		toast.error(translateFromBackend(error.data.message));
		return true;
	}
	return false;
}

/**
 * Execute a Convex mutation with automatic error-to-toast handling.
 *
 * Returns the mutation result on success, or `null` when an error was caught AND already
 * surfaced as a toast (rate limit or typed `ConvexError` with a translatable payload).
 * Untyped throws propagate so real bugs stay visible.
 *
 * ## Usage
 * ```ts
 * const client = useConvexClient();
 * const result = await safeMutation(client, api.myMutation, { arg: 'value' });
 * if (!result) return; // error already toasted
 *
 * // For mutations that follow the ConvexMutationResult envelope, toast success too:
 * toast[result.success ? 'success' : 'info'](translateFromBackend(result.message));
 * ```
 */
export async function safeMutation<Mutation extends FunctionReference<'mutation'>>(
	client: ConvexClient,
	mutation: Mutation,
	args: FunctionArgs<Mutation>
): Promise<FunctionReturnType<Mutation> | null> {
	try {
		return await client.mutation(mutation, args);
	} catch (error) {
		if (handleConvexError(error)) return null;
		throw error;
	}
}

/**
 * Execute a Convex action with automatic error-to-toast handling. See {@link safeMutation}
 * for the full error-branch rules — identical behaviour, just for actions.
 */
export async function safeAction<Action extends FunctionReference<'action'>>(
	client: ConvexClient,
	action: Action,
	args: FunctionArgs<Action>
): Promise<FunctionReturnType<Action> | null> {
	try {
		return await client.action(action, args);
	} catch (error) {
		if (handleConvexError(error)) return null;
		throw error;
	}
}
