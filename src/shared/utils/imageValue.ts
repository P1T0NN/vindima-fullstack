/**
 * Shared rules for the value an image form field holds — a picked `File` (uploaded on
 * submit) or a string the admin supplied / the DB seeded.
 *
 * Kept in one place because the storage layer's read side has the matching rule: a string
 * starting with `/` or `http` is used verbatim, anything else is treated as an uploaded
 * object key. A hand-typed `images/foo.webp` would therefore be looked up as a key, found
 * missing, and silently dropped — so the forms reject it up front instead.
 */

/** A `File` instance, guarded so this module stays loadable where `File` doesn't exist. */
export function isFileValue(value: unknown): value is File {
	return typeof File !== 'undefined' && value instanceof File;
}

/** Project-relative path ('/images/x.webp') or absolute URL ('https://…'). */
export function isUsableImageUrl(value: string): boolean {
	return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
}

/**
 * Form-level check for a single image value: a `File` passes (it becomes an object key on
 * submit); a string must be a usable URL. `null` / empty is "no value" — requiredness is a
 * separate rule, so this returns `true` and lets the schema decide.
 */
export function isValidImageValue(value: unknown): boolean {
	if (value === null || value === undefined || value === '') return true;
	if (isFileValue(value)) return true;
	return typeof value === 'string' && isUsableImageUrl(value);
}
