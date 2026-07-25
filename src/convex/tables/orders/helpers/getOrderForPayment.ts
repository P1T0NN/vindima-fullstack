// LIBRARIES
import { v } from 'convex/values';
import { internalQuery } from '@/convex/_generated/server';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Internal — hydrate one order for the payment actions (`StripeSystemDesign.md` §7.1).
 * Actions have no `ctx.db`, so every Stripe action reads the order through here.
 *
 * Returns the whole document deliberately: the session builder needs lines, amounts, currency,
 * delivery, contact, `_creationTime` (the expiry coupling) and both payment refs. Access
 * control lives in the calling action, not here — this is internal, unreachable from a client.
 */
export const getOrderForPayment = internalQuery({
	args: { orderId: v.id('orders') },
	handler: async (ctx, args): Promise<Doc<'orders'> | null> => {
		return await ctx.db.get(args.orderId);
	}
});
