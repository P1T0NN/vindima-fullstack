// Returns the authenticated caller's better-auth user id (string), or `null` when
// anonymous. Drop-in replacement for `@convex-dev/auth`'s `getAuthUserId` so existing
// call sites only need to swap the import path.
//
// `ctx.auth.getUserIdentity().subject` is set by the better-auth Convex plugin to the
// better-auth user id, so we don't need to touch the database to resolve it.

// TYPES
import type { QueryCtx, MutationCtx, ActionCtx } from '@/convex/_generated/server';

export const getAuthUserId = async (
	ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<string | null> => {
	const identity = await ctx.auth.getUserIdentity();
	return identity?.subject ?? null;
};
