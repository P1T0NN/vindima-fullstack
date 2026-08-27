// Returns the authenticated caller's better-auth user id (string), or `null` when
// anonymous. `ctx.auth.getUserIdentity().subject` is set by the better-auth Convex plugin
// to the better-auth user id, so no database lookup is required.

// TYPES
import type { QueryCtx, MutationCtx, ActionCtx } from '../../_generated/server.js';

export const getAuthUserId = async (
	ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> => {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject ?? null;
};
