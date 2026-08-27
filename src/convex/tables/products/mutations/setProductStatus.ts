/**
 * Change a product's status: draft ↔ active → archived (ProductsTableSystemDesign.md §6).
 * Archiving is the "delete": listings hide it, resolution goes unavailable, refs stay honored in
 * history. Un-archiving is allowed (it's just status). Activating stamps `wasActive` so the product
 * can never again be hard-deleted (a shipped ref is a public contract).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

const STATUS_MESSAGE: Record<'draft' | 'active' | 'archived', string> = {
	draft: 'Producto actualizado.',
	active: 'Producto publicado.',
	archived: 'Producto archivado.'
};

export const setProductStatus = adminMutation({
	args: {
		productId: v.id('products'),
		status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived'))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const product = await ctx.db.get(args.productId);
		if (!product) {
			return { success: false, message: 'No encontramos ese producto.' };
		}

		await ctx.db.patch(args.productId, {
			status: args.status,
			// Latch on first activation — gates hard-delete forever after.
			...(args.status === 'active' && !product.wasActive ? { wasActive: true } : {})
		});

		return { success: true, message: STATUS_MESSAGE[args.status] };
	}
});
