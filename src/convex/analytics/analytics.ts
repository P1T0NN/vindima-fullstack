// LIBRARIES
import { AnalyticsClient } from '@vllnt/convex-analytics';

// CONFIG
import { components } from '@/convex/_generated/api';

/**
 * Stable event-name constants for product code (keeps tracking call sites typo-safe).
 */
export const ANALYTICS_EVENT = {
	ORDER_SETTLED: 'order.settled',
	ORDER_REFUNDED: 'order.refunded',
	CUSTOMER_FIRST_PURCHASE: 'customer.first_purchase'
} as const;

/**
 * In-app analytics, backed by the `@vllnt/convex-analytics` component.
 *
 * COUNT-ONLY by design: the component rolls up event COUNTS (`metric`/`top`/`timeseries`),
 * not money. The dashboard's revenue/refund/series/product/category numbers are computed
 * from the orders table directly (`fetchDashboard`) — exact, no rollup lag or UTC-vs-local
 * skew. We still track the money-path events here so funnels/retention/uniques have data
 * when a future feature reads them. Nothing analytics-related is exposed to the browser:
 * there are no `analytics.client.*` wrappers, and no dashboard read goes through the
 * component — every read runs its own `requireAdmin` on the tables.
 */
export const analytics = new AnalyticsClient(components.analytics);
