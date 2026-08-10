// LIBRARIES
import { ConvexError } from 'convex/values';
import { defineAnalytics, event, property } from '@piton-/analytics-convex';

// CONFIG
import { components } from '@/convex/_generated/api';
import { authComponent } from '@/convex/auth/auth';
import { requireAdmin } from '@/convex/auth/middleware/authMiddleware';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { ConvexErrorPayload } from '@/shared/types/types';

/**
 * Stable event-name constants for product code. The library is the analytics
 * engine now; this map just keeps tracking call sites typo-safe and readable.
 *
 * The keys here mirror the dotted event names registered in `defineAnalytics`
 * below — keep the two lists in sync.
 */
export const ANALYTICS_EVENT = {
	ORDER_SETTLED: 'order.settled',
	ORDER_REFUNDED: 'order.refunded',
	ORDER_LINE_SOLD: 'order.line_sold',
	CUSTOMER_FIRST_PURCHASE: 'customer.first_purchase'
} as const;

/**
 * Metrics that require the Better Auth `admin` role to read. Everything else
 * only requires a signed-in user. Keep this in sync with the `.adminOnly()`
 * metrics.
 *
 * DORMANT BUT ARMED: the library only runs `authorize` for the
 * `analytics.client.*` wrappers, and this app re-exports none of them — every
 * read today goes through `fetchDashboard`, which does its own `requireAdmin`.
 * This policy is kept deliberately, not by accident: it is what makes
 * re-exporting a client wrapper safe. Delete it and the first one exported
 * ships unauthenticated.
 */
const ADMIN_ONLY_METRICS = new Set<string>([
	'revenue',
	'orders',
	'refunds',
	'newCustomers',
	'productRevenue'
]);

function _throwNotAuthenticated(): never {
	throw new ConvexError({
		code: 'NOT_AUTHENTICATED',
		message: { key: 'GenericMessages.NOT_AUTHENTICATED' }
	} satisfies ConvexErrorPayload);
}

/**
 * In-app analytics, backed by the `@piton-/analytics-convex` component.
 *
 * Events and metrics are runtime config: the generated helpers pass the config
 * hash to the component automatically. Server helpers (`analytics.track`,
 * `analytics.fetchSummary`, …) bypass `authorize` and are for Convex functions
 * that already enforce their own auth. The `analytics.client.*` wrappers (which
 * the browser calls) run `authorize`.
 */
export const analytics = defineAnalytics(components.analytics, {
	// E-commerce money-path events ONLY (AdminDashboardPageSystemDesign.md §4): no page
	// views, no clicks — Umami owns behavior; this component owns money. All tracked
	// server-side from the settle/refund/first-purchase seams.
	events: {
		orderSettled: event('order.settled', {
			label: 'Order settled',
			properties: {
				amountMinor: property.number({ required: true }),
				currency: property.string({ required: true })
			}
		}),
		orderRefunded: event('order.refunded', {
			label: 'Order refunded',
			properties: {
				amountMinor: property.number({ required: true }),
				currency: property.string({ required: true })
			}
		}),
		// One event per non-reward order line at settle — powers the product/category
		// breakdowns. `product` is the snapshot display name; `category` is the slug.
		orderLineSold: event('order.line_sold', {
			label: 'Order line sold',
			properties: {
				revenueMinor: property.number({ required: true }),
				qty: property.number({ required: true }),
				product: property.string({ required: true }),
				category: property.string({ required: true })
			}
		}),
		customerFirstPurchase: event('customer.first_purchase', {
			label: 'Customer first purchase',
			properties: {
				discountMinor: property.number()
			}
		})
	},
	// KPI metrics are `.hourly()` so period windows built from store-local midnights are
	// exact (daily rollups only know UTC days). `productRevenue` stays daily — a ±6h skew
	// on a top-products ranking is immaterial, and breakdowns read fewer rows that way.
	metrics: ({ count, sum }) => ({
		revenue: sum('Revenue', 'currency')
			.description('Gross settled order totals')
			.from('order.settled')
			.value('amountMinor')
			.hourly()
			.adminOnly(),
		orders: count('Orders').from('order.settled').hourly().adminOnly(),
		refunds: sum('Refunds', 'currency')
			.from('order.refunded')
			.value('amountMinor')
			.hourly()
			.adminOnly(),
		newCustomers: count('New customers')
			.description('First paid order per customer')
			.from('customer.first_purchase')
			.hourly()
			.adminOnly(),
		productRevenue: sum('Product revenue', 'currency')
			.from('order.line_sold')
			.value('revenueMinor')
			.by('product', 'category')
			.adminOnly()
	}),
	settings: {
		// Boutique volume; hourly rollups require lowVolume.
		trafficMode: 'lowVolume',
		defaultTimezone: 'America/Mexico_City',
		maxBreakdownItems: 25,
		rawEventRetentionDays: 90
		// Read/delete budgets are deliberately left at the 2.0 defaults. The per-query
		// budget (12,288 rows) is now SHARED across every read in a query — a dashboard
		// batch, a funnel's grouped reads — so an override below it buys nothing and only
		// makes `QUERY_TOO_LARGE` fire earlier. `maxQueryRangeDays` is a hard 366 ceiling
		// that settings can no longer raise, and the delete caps now top out at 4,096.
	},
	/**
	 * Runs only for the `analytics.client.*` wrappers the browser can call — see
	 * the note on ADMIN_ONLY_METRICS above: none are exported today, so this is
	 * dormant. All reads need a signed-in user; admin-only metrics additionally
	 * need the `admin` role.
	 */
	authorize: async (ctx, operation) => {
		// At runtime the library passes the real query/mutation ctx; the public
		// type is narrowed to `{ auth }`.
		const authCtx = ctx as unknown as QueryCtx;

		if (operation.type === 'read') {
			const requested = operation.metrics ?? (operation.metric ? [operation.metric] : []);

			if (requested.some((metric) => ADMIN_ONLY_METRICS.has(metric))) {
				await requireAdmin(authCtx);
				return;
			}

			const user = await authComponent.getAuthUser(authCtx);
			if (!user) _throwNotAuthenticated();
			return;
		}

		// configure / configureMetricEvaluation / track are not exposed as client
		// endpoints in this app. If one is ever re-exported, lock it to admins.
		await requireAdmin(authCtx);
	}
});

/**
 * Maintenance cron handlers. Registered in `convex/crons.ts` via
 * `analytics.registerCrons(...)`. Exported here so Convex registers them as
 * internal mutations under `internal.analytics.analytics.*`. All four are
 * required — `registerCrons` throws if one is missing.
 */
export const {
	processPendingHighVolumeAnalyticsEvents,
	purgeStaleAnalyticsEvents,
	purgeStaleAnalyticsRollups,
	compactAnalyticsRollups
} = analytics.crons;
