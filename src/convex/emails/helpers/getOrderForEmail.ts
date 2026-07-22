// LIBRARIES
import { v } from 'convex/values';
import { internalQuery } from '@/convex/_generated/server';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Read the order fresh for an email. Runs post-commit (the scheduling mutation already
 * settled/patched it), so this reflects final state. Returns `null` if it vanished.
 */
export const getOrderForEmail = internalQuery({
	args: { orderId: v.id('orders') },
	handler: async (ctx, args): Promise<Doc<'orders'> | null> => {
		return await ctx.db.get(args.orderId);
	}
});
