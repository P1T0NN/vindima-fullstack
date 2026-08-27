// Single source of truth for every type the validations feature exposes — dual-runtime
// (imported by Convex and Svelte alike), so nothing here may reference Svelte or the DOM.

/** One inline validation message per field key — the shape every form renders from. */
export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

/**
 * The slice of a zod issue this feature reads. Structural on purpose: zod v4 deprecated
 * the `ZodIssue` name, and `path` + `message` is the entire dependency — any
 * `error.issues` array satisfies it across zod versions.
 */
export type ZodIssueLike = { path: ReadonlyArray<PropertyKey>; message: string };
