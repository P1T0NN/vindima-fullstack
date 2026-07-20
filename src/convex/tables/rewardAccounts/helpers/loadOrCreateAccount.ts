// TYPES
import type { MutationCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Load the caller's account row, creating a zeroed one on first touch.
 *
 * OCC note: two concurrent first-touches both read empty here, but Convex detects the
 * read-range conflict on commit and retries the loser, which then sees the row — so no
 * duplicate account is created. No manual lock needed.
 */
export async function loadOrCreateAccount(
	ctx: MutationCtx,
	userId: string,
	now: number
): Promise<Doc<'rewardAccounts'>> {
	const existing = await ctx.db
		.query('rewardAccounts')
		.withIndex('by_user', (q) => q.eq('userId', userId))
		.unique();
	if (existing) return existing;

	const id = await ctx.db.insert('rewardAccounts', {
		userId,
		stamps: 0,
		pendingStamps: 0,
		availableRewards: 0,
		lifetimeStamps: 0,
		lastActivityAt: now
	});
	return (await ctx.db.get(id))!;
}
