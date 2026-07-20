/**
 * App-facing analytics barrel.
 *
 * Analytics is powered by the `@piton-/analytics-convex` component. Product code
 * tracks events with `analytics.track(ctx, ANALYTICS_EVENT.*, { ... })` and can
 * read via the `analytics.fetch*` server helpers. The registered read queries
 * the browser calls live in `./queries/analyticsQueries.ts`.
 */
export { analytics, ANALYTICS_EVENT } from './analytics';
