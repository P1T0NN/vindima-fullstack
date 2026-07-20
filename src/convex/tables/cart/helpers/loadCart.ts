// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/** Load the caller's cart doc (or `null`). Shared by every cart mutation. */
export async function loadCart(ctx: MutationCtx, userId: string): Promise<Doc<'carts'> | null> {
	return await ctx.db
		.query('carts')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.unique();
}
