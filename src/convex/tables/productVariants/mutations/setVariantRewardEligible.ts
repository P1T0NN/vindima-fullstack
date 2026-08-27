/**
 * Toggle a variant's reward eligibility (RewardItemsSystemDesign.md §4.5) — the ONLY
 * writer of `rewardEligible`, called from the /admin/rewards page.
 *
 * Enabling requires the variant to be redeemable right now (live + available + product
 * active) — the owner must never offer a dead reward. Disabling is always allowed: an
 * existing ACTIVE claim survives (the customer already reserved their item; disabling
 * only stops NEW claims).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

export const setVariantRewardEligible = adminMutation({
	args: {
		variantId: v.id('productVariants'),
		eligible: v.boolean()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const variant = await ctx.db.get(args.variantId);
		if (!variant || variant.deletedAt !== undefined) {
			return { success: false, message: 'No encontramos esa variante.' };
		}

		if (args.eligible) {
			const product = await ctx.db.get(variant.productId);
			if (!variant.available || product?.status !== 'active') {
				return {
					success: false,
					message: 'Este artículo no está a la venta por ahora; primero hazlo disponible.'
				};
			}
		}

		await ctx.db.patch(args.variantId, { rewardEligible: args.eligible ? true : undefined });

		return {
			success: true,
			message: args.eligible
				? 'Agregado a los artículos de recompensa.'
				: 'Eliminado de los artículos de recompensa.'
		};
	}
});
