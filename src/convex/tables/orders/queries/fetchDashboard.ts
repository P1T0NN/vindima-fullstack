/**
 * THE admin-dashboard query (`AdminDashboardPageSystemDesign.md` §4). One call returns
 * everything `/admin/dashboard` renders for a period. Fetched ONE-SHOT from the page (see
 * GeneralSystemDesignRule.md); only `fetchOrdersCounts` (separate file) is subscribed.
 *
 * Single-source rule: EVERY number below is computed from the orders / firstPurchases /
 * productCategories tables — exact, and windowed on store-local midnights via the
 * `settledAt` / `refundedAt` timestamps set at the settle/refund seams. `@vllnt/convex-analytics`
 * still ingests the money-path events (`analytics.track` at those seams) but the dashboard
 * reads none of its count rollups — those are reserved for future funnel/retention reads.
 * History starts the day `settledAt`/`refundedAt` shipped (as before: the day tracking shipped).
 */

// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// AUTH
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// HELPERS
import { countOrders } from './fetchOrdersCounts';

// CONFIG
import { CART_CONFIG, SHOP_CONFIG } from '@/shared/config';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc } from '@/convex/_generated/dataModel';
import type {
	DashboardKpis,
	DashboardPayload,
	DashboardPeriod
} from '@/shared/features/orders/types/ordersTypes';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const OFFSET_MS = SHOP_CONFIG.DASHBOARD_UTC_OFFSET_MINUTES * 60_000;

/** Days per period preset ('today' = 1: window starts at local midnight). */
const PERIOD_DAYS: Record<DashboardPeriod, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

/** Most recent store-local midnight at-or-before `t`, as a UTC ms epoch. */
const localMidnight = (t: number) => Math.floor((t + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS;
const localHour = (t: number) => Math.floor((t + OFFSET_MS) / HOUR_MS) * HOUR_MS - OFFSET_MS;

const kpisValidator = v.object({
	revenueMinor: v.number(),
	ordersCount: v.number(),
	refundsMinor: v.number(),
	newCustomers: v.number()
});

export const fetchDashboard = query({
	args: {
		period: v.union(v.literal('today'), v.literal('7d'), v.literal('30d'), v.literal('90d'))
	},
	returns: v.object({
		ordersCounts: v.object({ pendingCount: v.number(), toFulfillCount: v.number() }),
		kpis: v.object({ current: kpisValidator, previous: kpisValidator }),
		revenueSeries: v.array(v.object({ t: v.number(), valueMinor: v.number() })),
		topProducts: v.array(v.object({ name: v.string(), revenueMinor: v.number() })),
		categoryRevenue: v.array(v.object({ name: v.string(), revenueMinor: v.number() })),
		currency: v.string()
	}),
	handler: async (ctx, args): Promise<DashboardPayload> => {
		await requireAdmin(ctx);

		const now = Date.now();
		const days = PERIOD_DAYS[args.period];
		// Midnight-aligned local windows: current = [midnight (days-1 ago), now] (today
		// partial), previous = the `days` full days before that. Deltas read "period to
		// date vs full previous period" — the standard dashboard convention.
		const currentStart = localMidnight(now) - (days - 1) * DAY_MS;
		const previousStart = currentStart - days * DAY_MS;

		const [current, previous] = await Promise.all([
			windowData(ctx, currentStart, now),
			windowData(ctx, previousStart, currentStart)
		]);

		return {
			ordersCounts: await countOrders(ctx),
			kpis: { current: kpisFrom(current), previous: kpisFrom(previous) },
			revenueSeries: seriesFrom(current.settled, args.period, currentStart, now),
			topProducts: productsFrom(current.settled),
			categoryRevenue: await categoriesFrom(ctx, current.settled),
			currency: CART_CONFIG.CURRENCY
		};
	}
});

/** Settled + refunded + first-purchase rows for one `[from, to)` window. */
type WindowData = {
	settled: Doc<'orders'>[];
	refunded: Doc<'orders'>[];
	firstPurchases: Doc<'firstPurchases'>[];
};

async function windowData(ctx: QueryCtx, from: number, to: number): Promise<WindowData> {
	const [settled, refunded, firstPurchases] = await Promise.all([
		ctx.db
			.query('orders')
			.withIndex('by_settledAt', (q) => q.gte('settledAt', from).lt('settledAt', to))
			.collect(),
		ctx.db
			.query('orders')
			.withIndex('by_refundedAt', (q) => q.gte('refundedAt', from).lt('refundedAt', to))
			.collect(),
		ctx.db
			.query('firstPurchases')
			.withIndex('by_creation_time', (q) =>
				q.gte('_creationTime', from).lt('_creationTime', to)
			)
			.collect()
	]);
	return { settled, refunded, firstPurchases };
}

/** One window's KPIs. Revenue is NET (settled minus refunded). */
function kpisFrom({ settled, refunded, firstPurchases }: WindowData): DashboardKpis {
	const gross = settled.reduce((sum, o) => sum + o.amounts.totalMinor, 0);
	const refundsMinor = refunded.reduce((sum, o) => sum + o.amounts.totalMinor, 0);
	return {
		revenueMinor: gross - refundsMinor,
		ordersCount: settled.length,
		refundsMinor,
		newCustomers: firstPurchases.length
	};
}

/** Gross settled revenue per bucket — hourly for "today", local days otherwise. Every bucket in
 *  the period is emitted (zero-padded), so the x-axis always spans the full range: with a single
 *  sale-day an unpadded series collapses to one dot and no line. */
function seriesFrom(
	settled: Doc<'orders'>[],
	period: DashboardPeriod,
	currentStart: number,
	now: number
): DashboardPayload['revenueSeries'] {
	const hourly = period === 'today';
	const bucket = hourly ? localHour : localMidnight;
	const step = hourly ? HOUR_MS : DAY_MS;

	const byBucket = new Map<number, number>();
	for (const order of settled) {
		const t = bucket(order.settledAt!);
		byBucket.set(t, (byBucket.get(t) ?? 0) + order.amounts.totalMinor);
	}

	const out: DashboardPayload['revenueSeries'] = [];
	for (let t = bucket(currentStart); t <= bucket(now); t += step) {
		out.push({ t, valueMinor: byBucket.get(t) ?? 0 });
	}
	return out;
}

/** Top 5 products by revenue, from the settled lines' price snapshots. */
function productsFrom(settled: Doc<'orders'>[]): DashboardPayload['topProducts'] {
	const byProduct = new Map<string, number>();
	for (const order of settled) {
		for (const line of order.lines) {
			if (line.isRewardLine) continue;
			byProduct.set(line.name, (byProduct.get(line.name) ?? 0) + line.unitPriceMinor * line.qty);
		}
	}
	return [...byProduct.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, revenueMinor]) => ({ name, revenueMinor }));
}

/** Revenue per category (slug → name), resolved line-by-line at read time. */
async function categoriesFrom(
	ctx: QueryCtx,
	settled: Doc<'orders'>[]
): Promise<DashboardPayload['categoryRevenue']> {
	const byCategory = new Map<string, number>();
	// ponytail: one point-read per non-reward line. Boutique volume is fine; if a
	// high-SKU catalog ever makes this slow, denormalize the category slug onto the
	// order line at placement (the same snapshot the name already is).
	for (const order of settled) {
		for (const line of order.lines) {
			if (line.isRewardLine) continue;
			const variant = await ctx.db
				.query('productVariants')
				.withIndex('by_ref', (q) => q.eq('ref', line.productRef))
				.unique();
			const product = variant ? await ctx.db.get(variant.productId) : null;
			const slug = product?.category ?? 'otros';
			byCategory.set(slug, (byCategory.get(slug) ?? 0) + line.unitPriceMinor * line.qty);
		}
	}

	const allCategories = await ctx.db.query('productCategories').collect();
	const nameBySlug = new Map(allCategories.map((c) => [c.slug, c.name]));
	return [...byCategory.entries()]
		.sort((a, b) => b[1] - a[1])
		.map(([slug, revenueMinor]) => ({
			name: slug === 'otros' ? 'Otros' : (nameBySlug.get(slug) ?? slug),
			revenueMinor
		}));
}
