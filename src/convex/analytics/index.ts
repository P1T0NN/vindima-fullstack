/**
 * App-facing analytics barrel.
 *
 * Analytics is powered by the `@piton-/analytics-convex` component. Product code
 * tracks events with `analytics.track(ctx, ANALYTICS_EVENT.*, { ... })` and reads
 * via the `analytics.fetch*` server helpers — today only from `fetchDashboard`,
 * which batches its four KPI metrics into one `fetchDashboardMetrics` call per
 * window. NOTHING analytics-related is exposed to the browser: there are no
 * `analytics.client.*` wrappers re-exported anywhere in this app, so every read
 * goes through a query that runs its own `requireAdmin`.
 *
 * Everything below is an internal ops function — CLI/deploy only, never a client
 * call. Not wired: `fetchIngestionHealth` (reports the high-volume batch backlog;
 * every metric here is `lowVolume`, which writes rollups inline, so there is no
 * backlog to watch) and `backfillMonthActorClaims` (a pre-2.0 migration for
 * `distinctActors` metrics; this config has none).
 */
export { analytics, ANALYTICS_EVENT } from './analytics';

// LIBRARIES
import { v } from 'convex/values';
import { internalQuery } from '@/convex/_generated/server';
import { internalMutation } from '@/convex/functions';
import { analytics as analyticsInstance } from './analytics';

/**
 * Push the events/metrics/settings config to the analytics component. Run via
 * `npx convex run analytics/index:writeConfiguration` (the `predev` script) after any
 * change to `defineAnalytics` config.
 */
export const writeConfiguration = internalMutation({
	args: {},
	handler: async (ctx) => await analyticsInstance.writeConfiguration(ctx)
});

/**
 * Ghost-data audit. Renaming or deleting a metric/journey in `defineAnalytics` leaves its
 * rollup and claim rows behind — nothing reads them, and nothing else would ever report
 * them. This finds them with O(distinct names) index seeks, never a table scan, and also
 * reports how many stale stored config rows are prunable.
 *
 *   bunx convex run analytics/index:auditData
 *
 * Run it after any metric rename; feed `orphanedMetrics` / `orphanedJourneys` straight
 * into `pruneData` below.
 */
export const auditData = internalQuery({
	args: {},
	handler: async (ctx) => await analyticsInstance.fetchDataAudit(ctx)
});

/**
 * Delete the rows `auditData` reported. Batched and self-scheduling — one call drains
 * everything — and it refuses any name still present in the config, so a typo here can
 * never mass-delete live metric data.
 *
 *   bunx convex run analytics/index:pruneData '{"metrics":["oldMetricName"]}'
 */
export const pruneData = internalMutation({
	args: {
		metrics: v.optional(v.array(v.string())),
		journeys: v.optional(v.array(v.string()))
	},
	handler: async (ctx, args) => await analyticsInstance.pruneData(ctx, args)
});
