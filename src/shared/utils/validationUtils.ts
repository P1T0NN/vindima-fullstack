// TYPES
import type { FieldErrors } from '../types/types';
import type { ZodIssue } from 'zod';

/**
 * Maps Zod `issues` to field keys (top path segment): first issue message wins per field.
 * Pass `includeOnlyKeys` to drop unrelated fields (e.g. scheduling vs contact when using a merged schema).
 */
export function zodIssuesToFieldErrors<T extends string>(
	issues: readonly ZodIssue[],
	includeOnlyKeys?: readonly T[]
): FieldErrors<T> {
	const out: FieldErrors<T> = {};
	for (const issue of issues) {
		const key = issue.path[0];
		if (
			typeof key !== 'string' ||
			(includeOnlyKeys !== undefined && !(includeOnlyKeys as readonly string[]).includes(key))
		) {
			continue;
		}
		if (!(key in out)) {
			(out as Record<string, string>)[key] = issue.message;
		}
	}
	return out;
}

/**
 * Clear one field’s validation error (immutable snapshot). Prefer {@link clearFieldErrorOn} for bindings.
 */
export function clearZodFieldError<T extends string>(
	fieldErrors: FieldErrors<T>,
	key: T
): FieldErrors<T> {
	if (!(key in fieldErrors)) return fieldErrors;
	const next = { ...fieldErrors };
	delete next[key];
	return next;
}

/** Any reactive object exposing `fieldErrors` (e.g. booking / contact section stores). */
export type FieldErrorsContext<T extends string = string> = {
	fieldErrors: FieldErrors<T>;
};

/**
 * Returns a handler suitable for `oninput` / `onchange`: clears validation for `key` on `context.fieldErrors`.
 *
 * @example
 * ```svelte
 * oninput={clearFieldErrorOn(contactSectionClass, 'name')}
 * ```
 */
export function clearFieldErrorOn<T extends string>(
	context: FieldErrorsContext<T>,
	key: T
): () => void {
	return () => {
		context.fieldErrors = clearZodFieldError(context.fieldErrors, key);
	};
}
