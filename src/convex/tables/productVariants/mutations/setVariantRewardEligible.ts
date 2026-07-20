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
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const setVariantRewardEligible = adminMutation('setVariantRewardEligible')({
	args: {
		variantId: v.id('productVariants'),
		eligible: v.boolean()
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const variant = await ctx.db.get(args.variantId);
		if (!variant || variant.deletedAt !== undefined) {
			return { success: false, message: { key: 'ProductMessages.VARIANT_NOT_FOUND' } };
		}

		if (args.eligible) {
			const product = await ctx.db.get(variant.productId);
			if (!variant.available || product?.status !== 'active') {
				return { success: false, message: { key: 'RewardMessages.REWARD_ITEM_NOT_AVAILABLE' } };
			}
		}

		await ctx.db.patch(args.variantId, { rewardEligible: args.eligible ? true : undefined });

		ctx.audit(AUDIT_ACTIONS.REWARD_ITEM_SET, {
			resource: { table: 'productVariants', id: args.variantId },
			before: { ref: variant.ref, rewardEligible: variant.rewardEligible ?? false },
			after: { rewardEligible: args.eligible }
		});

		return {
			success: true,
			message: {
				key: args.eligible
					? 'RewardMessages.REWARD_ITEM_ADDED'
					: 'RewardMessages.REWARD_ITEM_REMOVED'
			}
		};
	}
});
