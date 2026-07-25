// LIBRARIES
import { toast } from 'svelte-sonner';

// UTILS
import { translateFromBackend, type TranslatableMessage } from '@/utils/translateFromBackend.js';

/**
 * Dispatch a `ConvexMutationResult`-shaped envelope to a toast and signal
 * whether the caller should proceed with success-only side effects.
 *
 * Three branches the caller cares about, collapsed into one return value:
 *   1. `null` (handled error already toasted by `safeMutation` / `handleConvexError`)
 *      → returns `false`. No additional toast.
 *   2. `{ success: false, message }` (soft, predictable failure — e.g. a business-rule
 *      violation the mutation chose to return rather than throw) → `toast.error` with the
 *      backend's translated message, returns `false`.
 *   3. `{ success: true, message }` (happy path) → `toast.success`, returns `true`.
 *
 * @example
 * const result = await safeMutation(convex, api.tables.users.userMutations.deleteUser, { userId });
 * if (!toastResult(result)) return;
 * // success-only side effects (redirect, clear form, …)
 */
export function toastResult(
	result: { success: boolean; message: TranslatableMessage } | null
): boolean {
	if (!result) return false;
	const message = translateFromBackend(result.message);
	if (result.success) {
		toast.success(message);
		return true;
	}
	toast.error(message);
	return false;
}

/**
 * Failure-only sibling of {@link toastResult}, for flows whose success path NAVIGATES.
 *
 * A success toast fired immediately before a redirect never gets read: it paints for a frame and
 * dies with the page. Worse, it competes with the destination, which states the outcome properly
 * (a confirmation page, or the payment page the shopper is being sent to). Use this wherever the
 * happy path leaves the current view, and let the destination do the confirming.
 */
export function toastError(
	result: { success: boolean; message: TranslatableMessage } | null
): void {
	if (!result || result.success) return;
	toast.error(translateFromBackend(result.message));
}
