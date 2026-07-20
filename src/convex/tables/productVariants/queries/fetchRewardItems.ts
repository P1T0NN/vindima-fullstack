/**
 * Admin list — reward-eligible variants (the current reward items), paginated (cursor
 * mode) for the `/admin/rewards` ConvexDataList. One row per variant via the
 * `by_reward_eligible` index; `enrich` attaches each variant's product for display.
 * Eligible variants are never tombstoned (the variant-delete gate blocks it), so no
 * post-filtering is needed.
 */

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

// TYPES
import type { RewardItemRow } from '@/shared/features/productVariants/types/productVariantsTypes';

export const fetchRewardItems = fetchOptimized({
	table: 'productVariants',
	auth: 'admin',
	where: () => ({ index: 'by_reward_eligible', eq: { rewardEligible: true } }),
	enrich: async (ctx, page): Promise<RewardItemRow[]> => {
		const productIds = [...new Set(page.map((variant) => variant.productId))];
		const products = new Map(
			await Promise.all(productIds.map(async (id) => [id, await ctx.db.get(id)] as const))
		);
		return page.map((variant) => ({ ...variant, product: products.get(variant.productId) ?? null }));
	}
});
