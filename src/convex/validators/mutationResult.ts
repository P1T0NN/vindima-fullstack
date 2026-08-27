// LIBRARIES
import { v, type GenericValidator } from 'convex/values';

/**
 * Validator form of the shared mutation envelope (`ConvexMutationResult` in
 * `@/shared/types/types`). Every public mutation's `returns:` should be one of these so
 * the client always gets the same `{ success, message, data? }` shape.
 *
 * `message` is already display-ready text so callers can surface it directly.
 */
/** The bare `{ success, message }` envelope — for mutations that return no payload. */
export const mutationResult = v.object({
	success: v.boolean(),
	message: v.string()
});

/** The envelope with a typed `data` payload — for success paths that return something. */
export const mutationResultWith = <D extends GenericValidator>(data: D) =>
	v.object({
		success: v.boolean(),
		message: v.string(),
		data: v.optional(data)
	});
