/**
 * Change a product's status: draft ↔ active → archived (ProductsTableSystemDesign.md §6).
 * Archiving is the "delete": listings hide it, resolution goes unavailable, refs stay honored in
 * history. Un-archiving is allowed (it's just status). Activating stamps `wasActive` so the product
 * can never again be hard-deleted (a shipped ref is a public contract).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

const STATUS_MESSAGE: Record<'draft' | 'active' | 'archived', string> = {
	draft: 'ProductMessages.PRODUCT_UPDATED',
	active: 'ProductMessages.PRODUCT_RESTORED',
	archived: 'ProductMessages.PRODUCT_ARCHIVED'
};

export const setProductStatus = adminMutation('setProductStatus')({
	args: {
		productId: v.id('products'),
		status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const product = await ctx.db.get(args.productId);
		if (!product) {
			return { success: false, message: { key: 'ProductMessages.PRODUCT_NOT_FOUND' } };
		}

		await ctx.db.patch(args.productId, {
			status: args.status,
			// Latch on first activation — gates hard-delete forever after.
			...(args.status === 'active' && !product.wasActive ? { wasActive: true } : {})
		});

		ctx.audit(AUDIT_ACTIONS.PRODUCT_STATUS, {
			resource: { table: 'products', id: args.productId },
			before: { status: product.status },
			after: { status: args.status }
		});

		return { success: true, message: { key: STATUS_MESSAGE[args.status] } };
	}
});
