/**
 * App-facing analytics barrel.
 *
 * Analytics is powered by the `@vllnt/convex-analytics` component. Product code tracks
 * events with `analytics.track(ctx, ANALYTICS_EVENT.*, { ... })`. Nothing analytics-related
 * is exposed to the browser, and no dashboard read goes through the component — every
 * number `/admin/dashboard` renders is computed from the orders/firstPurchases tables
 * (`fetchDashboard`), which run their own `requireAdmin`. The component only accumulates
 * the event log + count rollups for future funnel/retention/uniques reads.
 */
export { analytics, ANALYTICS_EVENT } from './analytics';
