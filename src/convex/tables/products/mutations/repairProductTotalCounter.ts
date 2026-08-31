// LIBRARIES
import { v } from 'convex/values';

// CONVEX
import { internalMutation } from '@/convex/functions.js';

// AGGREGATES
import { productFilterAggregate } from '../aggregates/productFilterAggregate.js';

// COUNTERS
import { PRODUCT_TOTAL_COUNTER_KEY, productTotalCounter } from '../counters/productTotalCounter.js';

const MAX_PRODUCTS = 10_000;
const MAX_FILTER_PRODUCTS = 100;

/** One-time repair for deployments whose counter was introduced after product data. */
export const repairProductTotalCounter = internalMutation({
	args: {},
	returns: v.object({
		previous: v.number(),
		actual: v.number(),
		repaired: v.number()
	}),
	handler: async (ctx) => {
		const products = await ctx.db.query('products').take(MAX_PRODUCTS + 1);
		if (products.length > MAX_PRODUCTS) {
			throw new Error(`Product counter repair is capped at ${MAX_PRODUCTS} rows`);
		}

		const previous = await productTotalCounter.count(ctx, PRODUCT_TOTAL_COUNTER_KEY);
		await productTotalCounter.reset(ctx, PRODUCT_TOTAL_COUNTER_KEY);
		await productTotalCounter.add(ctx, PRODUCT_TOTAL_COUNTER_KEY, products.length);

		return {
			previous,
			actual: products.length,
			repaired: await productTotalCounter.count(ctx, PRODUCT_TOTAL_COUNTER_KEY)
		};
	}
});

/** Idempotently add existing products to the aggregate used by admin filters. */
export const repairProductFilterAggregate = internalMutation({
	args: {},
	returns: v.object({ processed: v.number(), aggregateTotal: v.number() }),
	handler: async (ctx) => {
		const products = await ctx.db.query('products').take(MAX_FILTER_PRODUCTS + 1);
		if (products.length > MAX_FILTER_PRODUCTS) {
			throw new Error(`Product filter repair is capped at ${MAX_FILTER_PRODUCTS} rows`);
		}

		await productFilterAggregate.clear(ctx);
		for (const product of products) {
			await productFilterAggregate.insert(ctx, product);
		}

		return {
			processed: products.length,
			aggregateTotal: await productFilterAggregate.count(ctx)
		};
	}
});
