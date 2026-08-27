// LIBRARIES
import { ConvexError } from 'convex/values';

// CONVEX
import type { UserIdentity } from 'convex/server';
import type { MutationCtx } from '../../_generated/server.js';

type AuthContext = Pick<MutationCtx, 'auth'>;

export async function requireIdentity(ctx: AuthContext): Promise<UserIdentity> {
	const identity = await ctx.auth.getUserIdentity();
	if (identity === null) {
		throw new ConvexError({
			code: 'UNAUTHENTICATED',
			message: 'Authentication required'
		});
	}

	return identity;
}

export async function requireAdminIdentity(ctx: AuthContext): Promise<UserIdentity> {
	const identity = await requireIdentity(ctx);
	const role = (identity as UserIdentity & { role?: string }).role;
	if (role !== 'admin') {
		throw new ConvexError({
			code: 'FORBIDDEN',
			message: 'Admin access required'
		});
	}

	return identity;
}
