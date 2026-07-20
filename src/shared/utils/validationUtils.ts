// TYPES
import type { FieldErrors } from '../types/types';
import type { ZodIssue } from 'zod';

/** Trim; empty or whitespace-only → `undefined`. Safe for optional form/API fields. */
export function trimToUndefined(value: string | undefined | null): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/** Integer minor units, strictly positive — mirrors `productVariantInputSchema.priceMinor`
 *  (a sellable variant always costs something; free reward items are zero-priced order lines). */
export function isValidPrice(n: number): boolean {
	return Number.isInteger(n) && n > 0;
}

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
 * Per-row errors for one item of an array field, keyed by the item's own property name
 * (`issues` with path `[arrayKey, index, prop]`). For array editors rendered outside the
 * declared fields — `zodIssuesToFieldErrors` collapses those to the array key alone, which
 * can't say WHICH row failed.
 *
 * @example
 * ```ts
 * const errors = zodIssuesForArrayItem(issues, 'variants', i); // { ref: '…', priceMinor: '…' }
 * ```
 */
export function zodIssuesForArrayItem(
	issues: readonly ZodIssue[],
	arrayKey: string,
	index: number
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const issue of issues) {
		const [key, itemIndex, prop] = issue.path;
		if (key !== arrayKey || itemIndex !== index || typeof prop !== 'string') continue;
		if (!(prop in out)) out[prop] = issue.message;
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
