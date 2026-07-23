/**
 * App-facing analytics barrel.
 *
 * Analytics is powered by the `@piton-/analytics-convex` component. Product code
 * tracks events with `analytics.track(ctx, ANALYTICS_EVENT.*, { ... })` and can
 * read via the `analytics.fetch*` server helpers. The registered read queries
 * the browser calls live in `./queries/analyticsQueries.ts`.
 */
export { analytics, ANALYTICS_EVENT } from './analytics';

// LIBRARIES
import { internalMutation } from '@/convex/_generated/server';
import { analytics as analyticsInstance } from './analytics';

/**
 * Push the events/metrics/settings config to the analytics component. Run via
 * `npx convex run analytics/index:writeConfiguration` (the `predev` script) after any
 * change to `defineAnalytics` config. Internal: CLI/deploy only, never a client call.
 */
export const writeConfiguration = internalMutation({
	args: {},
	handler: async (ctx) => await analyticsInstance.writeConfiguration(ctx)
});
