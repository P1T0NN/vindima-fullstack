// LIBRARIES
import { v, type GenericValidator } from 'convex/values';

/**
 * Validator form of the shared mutation envelope (`ConvexMutationResult` in
 * `@/convex/types/convexTypes`). Every public mutation's `returns:` should be one of these so
 * the client always gets the same `{ success, message, data? }` shape.
 *
 * `message` is a backend `TranslatableMessage` — a stable key (+ optional serialisable params),
 * never display text; the frontend resolves it via `translateFromBackend`.
 */
export const translatableMessageValidator = v.object({
	key: v.string(),
	params: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean())))
});

/** The bare `{ success, message }` envelope — for mutations that return no payload. */
export const mutationResult = v.object({
	success: v.boolean(),
	message: translatableMessageValidator
});

/** The envelope with a typed `data` payload — for success paths that return something. */
export const mutationResultWith = <D extends GenericValidator>(data: D) =>
	v.object({
		success: v.boolean(),
		message: translatableMessageValidator,
		data: v.optional(data)
	});
