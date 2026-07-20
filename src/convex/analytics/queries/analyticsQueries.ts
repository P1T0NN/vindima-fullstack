// ANALYTICS
import { analytics } from '../analytics';

/**
 * Registered analytics read queries the browser calls through Convex.
 *
 * These are the library's `analytics.client.*` wrappers, which run the
 * `authorize` callback defined in `../analytics.ts` (signed-in for all reads,
 * admin role for admin-only metrics). They are re-exported from this exact
 * module so the generated API path stays
 * `api.analytics.queries.analyticsQueries.{timeSeries,breakdown,summary}` — the
 * path `useAnalytics` and the charts page already consume.
 *
 * Args and response shapes are identical to the previous hand-rolled queries, so
 * the frontend (hook, `+page.svelte`, and `chartTypes`) needs no changes.
 */
export const { timeSeries, breakdown, summary } = analytics.client;
