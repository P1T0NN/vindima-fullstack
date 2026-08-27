/**
 * Admin list — reward-eligible variants with their product, paginated for the rewards page.
 * Totals stay intentionally omitted until an aggregate is needed.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { productVariantFilterAggregate } from '../aggregates/productVariantFilterAggregate.js';
import {
	REWARD_ELIGIBLE_VARIANT_COUNTER_KEY,
	rewardEligibleVariantTotalCounter
} from '../counters/rewardEligibleVariantTotalCounter.js';

const productRowValidator = v.object({
	_id: v.id('products'),
	_creationTime: v.number(),
	slug: v.string(),
	name: v.string(),
	description: v.optional(v.string()),
	images: v.array(v.string()),
	category: v.string(),
	status: v.union(v.literal('draft'), v.literal('active'), v.literal('archived')),
	featured: v.optional(v.boolean()),
	wasActive: v.optional(v.boolean()),
	sortOrder: v.number()
});

const rewardItemRowValidator = v.object({
	_id: v.id('productVariants'),
	_creationTime: v.number(),
	productId: v.id('products'),
	ref: v.string(),
	label: v.optional(v.string()),
	priceMinor: v.number(),
	available: v.boolean(),
	sortOrder: v.number(),
	deletedAt: v.optional(v.number()),
	rewardEligible: v.optional(v.boolean()),
	product: v.union(productRowValidator, v.null())
});

export const fetchRewardItems = fetchOptimizedQuery({
	auth: 'admin',
	returns: paginatedPageValidator(rewardItemRowValidator),
	count: productVariantFilterAggregate,
	countTotal: ({ ctx }) =>
		rewardEligibleVariantTotalCounter.count(ctx, REWARD_ELIGIBLE_VARIANT_COUNTER_KEY),
	fetchPage: async ({ ctx, paginationOpts }) => {
		const page = await getPagination(
			ctx.db
				.query('productVariants')
				.withIndex('by_reward_eligible', (q) => q.eq('rewardEligible', true))
				.order('desc'),
			{ paginationOpts }
		);

		const productIds = [...new Set(page.items.map((variant) => variant.productId))];
		const products = new Map(
			await Promise.all(productIds.map(async (id) => [id, await ctx.db.get(id)] as const))
		);

		return {
			...page,
			items: page.items.map((variant) => ({
				...variant,
				product: products.get(variant.productId) ?? null
			}))
		};
	}
});
