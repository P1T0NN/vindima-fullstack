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
