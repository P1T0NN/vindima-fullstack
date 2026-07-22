/**
 * Admin — one full order for the `/admin/orders/[id]` detail page. Admin-only (unlike the
 * public `fetchOrder`, which enforces owner/guest access). A malformed / unknown id resolves
 * to `null` so the page renders a clean "not found" instead of throwing.
 */

// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// MIDDLEWARE
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

export const fetchOrderForAdmin = query({
	args: { orderId: v.string() },
	handler: async (ctx, args): Promise<Doc<'orders'> | null> => {
		await requireAdmin(ctx);

		const id = ctx.db.normalizeId('orders', args.orderId);
		if (!id) return null;

		return await ctx.db.get(id);
	}
});
