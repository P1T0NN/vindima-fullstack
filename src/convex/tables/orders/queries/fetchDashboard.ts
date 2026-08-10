/**
 * THE admin-dashboard query (`AdminDashboardPageSystemDesign.md` §4). One call returns
 * everything `/admin/dashboard` renders for a period. Fetched ONE-SHOT from the page (see
 * GeneralSystemDesignRule.md); only `fetchOrdersCounts` (separate file) is subscribed.
 *
 * Two-source rule in action:
 * - Trends/KPIs/breakdowns ← `@piton-/analytics-convex` rollups (`analytics.fetch*` server
 *   helpers — hourly rollups, so windows built from store-local midnights are exact).
 *   Events are tracked at the settle/refund/first-purchase seams; history starts the day
 *   tracking shipped. Five component calls total: one KPI batch per window, one series,
 *   two breakdowns (different dimensions, so they cannot batch).
 * - Exact operational truth (order work-queue counts) ← live state. Rollups lag and
 *   approximate; a work queue must not.
 */

// LIBRARIES
import { v } from 'convex/values';
import { query } from '@/convex/_generated/server';

// ANALYTICS
import { analytics } from '@/convex/analytics';

// AUTH
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// HELPERS
import { countOrders } from './fetchOrdersCounts';

// CONFIG
import { CART_CONFIG, SHOP_CONFIG } from '@/shared/config';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type {
	DashboardKpis,
	DashboardPayload,
	DashboardPeriod
} from '@/shared/features/orders/types/ordersTypes';

const DAY_MS = 86_400_000;
const OFFSET_MS = SHOP_CONFIG.DASHBOARD_UTC_OFFSET_MINUTES * 60_000;

/** Days per period preset ('today' = 1: window starts at local midnight). */
const PERIOD_DAYS: Record<DashboardPeriod, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

/** Most recent store-local midnight at-or-before `t`, as a UTC ms epoch. */
const localMidnight = (t: number) => Math.floor((t + OFFSET_MS) / DAY_MS) * DAY_MS - OFFSET_MS;

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

		const kpiFetch = (from: number, to: number): Promise<DashboardKpis> => kpis(ctx, from, to);

		const [current, previous, revenueSeries, topProducts, categoryRevenue] = await Promise.all([
			kpiFetch(currentStart, now),
			kpiFetch(previousStart, currentStart),
			series(ctx, args.period, currentStart, now),
			products(ctx, currentStart, now),
			categories(ctx, currentStart, now)
		]);

		return {
			ordersCounts: await countOrders(ctx),
			kpis: { current, previous },
			revenueSeries,
			topProducts,
			categoryRevenue,
			currency: CART_CONFIG.CURRENCY
		};
	}
});

/** The four KPI metrics, read as ONE batch per window. */
const KPI_METRICS = ['revenue', 'orders', 'refunds', 'newCustomers'] as const;

/**
 * One window's KPIs from the hourly rollups. Revenue is NET (settled minus refunded).
 *
 * `fetchDashboardMetrics` reads all four metrics in a single component call, coalescing
 * their rollup scans and sequencing them against ONE shared read budget — four separate
 * `fetchSummary` calls each opened their own. Same rows, same numbers, a quarter of the
 * round trips.
 *
 * The window is passed explicitly rather than using the batch's `includeComparison`: that
 * derives the previous period itself, normalized to UTC day boundaries, which would not
 * match the store-local midnight windows this dashboard is built on (`localMidnight`
 * above). Two explicit-range calls keep the periods exactly as they were.
 */
async function kpis(ctx: QueryCtx, from: number, to: number): Promise<DashboardKpis> {
	const { metrics } = await analytics.fetchDashboardMetrics(ctx, {
		metrics: [...KPI_METRICS],
		from,
		to
	});
	const value = (metric: (typeof KPI_METRICS)[number]) => metrics[metric]?.value ?? 0;
	const refundsMinor = value('refunds');

	return {
		revenueMinor: value('revenue') - refundsMinor,
		ordersCount: value('orders'),
		refundsMinor,
		newCustomers: value('newCustomers')
	};
}

/** Gross revenue buckets — hourly for "today", local days otherwise (defaultTimezone). */
async function series(
	ctx: QueryCtx,
	period: DashboardPeriod,
	from: number,
	to: number
): Promise<DashboardPayload['revenueSeries']> {
	const result = await analytics.fetchTimeSeries(ctx, {
		metric: 'revenue',
		from,
		to,
		...(period === 'today' ? {} : { bucketUnit: 'day' as const })
	});
	const key = result.meta.seriesKeys[0];
	return result.data.map((row) => ({
		t: row.date,
		valueMinor: (key !== undefined ? row[key] : 0) ?? 0
	}));
}

/** Top 5 products by revenue (line snapshots carried the display name at track time). */
async function products(
	ctx: QueryCtx,
	from: number,
	to: number
): Promise<DashboardPayload['topProducts']> {
	const result = await analytics.fetchBreakdown(ctx, {
		metric: 'productRevenue',
		from,
		to,
		groupBy: 'product'
	});
	return result.data.slice(0, 5).map((d) => ({ name: d.key, revenueMinor: d.value }));
}

/** Revenue per category — events store the slug; display names resolve here. */
async function categories(
	ctx: QueryCtx,
	from: number,
	to: number
): Promise<DashboardPayload['categoryRevenue']> {
	const result = await analytics.fetchBreakdown(ctx, {
		metric: 'productRevenue',
		from,
		to,
		groupBy: 'category'
	});
	// Category display names (slug → name). Single-digit rows; collect is fine.
	const allCategories = await ctx.db.query('productCategories').collect();
	const nameBySlug = new Map(allCategories.map((c) => [c.slug, c.name]));
	return result.data.map((d) => ({
		name: d.key === 'otros' ? 'Otros' : (nameBySlug.get(d.key) ?? d.key),
		revenueMinor: d.value
	}));
}
