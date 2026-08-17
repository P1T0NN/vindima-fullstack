---
name: vllnt-convex-analytics
description: Embedded Convex analytics with rollup-on-write so metric, top, and timeseries reads stay O(1) — no external SaaS required. Use this skill whenever the user mentions backend, analytics, event-tracking. Also trigger when discussing rollups, timeseries, even if they don't explicitly ask for Analytics.
---

# Analytics

## Instructions

Use Analytics to embedded convex analytics with rollup-on-write so metric, top, and timeseries reads stay o(1) — no external saas required. This Convex component integrates directly with your backend.

### Installation

```bash
npm install @vllnt/convex-analytics
```

### Capabilities

- Read aggregated metrics in O(1) via rollup-on-write backed by convex-dev/aggregate and sharded counters, regardless of event volume.
- Declare only the dimensions you query and get pre-aggregated breakdowns, timeseries, funnels, and retention without schema changes.
- React to analytics data live using optional hooks from @vllnt/convex-analytics/react that wrap your re-exported query refs.
- Keep analytics fully in-app with sandboxed tables, host-controlled auth, and no data leaving your Convex deployment.

## Examples

### how to track events and query rollups in Convex without a third-party analytics service

Install @vllnt/convex-analytics, mount it in convex.config.ts with app.use(analytics), and instantiate AnalyticsClient with the prop keys you want to roll up on. Calling analytics.track() increments rollup counters at write time, so analytics.metric(), analytics.top(), and analytics.timeseries() return pre-aggregated results in O(1) without scanning raw events.

### how to build funnel and retention analytics in a Convex app

AnalyticsClient exposes analytics.funnel(ctx, steps, opts) for ordered step conversion keyed by subjectRef and analytics.retention(ctx, opts) for cohort return rates by first-seen period. Both read from TTL-pruned raw events backed by indexes, so they stay bounded and do not require a separate data warehouse.

### how to add web analytics pageview tracking to a Convex backend

Import webDimensions and trackPageview from @vllnt/convex-analytics/web and pass webDimensions to the AnalyticsClient dimensions config. trackPageview builds path, referrer, device, browser, os, country, and UTM props from request headers using the bundled parseUserAgent and geoFromHeaders helpers, then calls track() on the core client.

### how to expose Convex analytics data to Claude or an AI agent via MCP

@vllnt/convex-analytics ships an MCP server with seven tools including track, get_metric, get_top, get_timeseries, get_uniques, detect_anomalies, and query_analytics. Register it with Claude Code using claude mcp add, passing your CONVEX_URL and an ANALYTICS_API_KEY, and the agent can read and write analytics without direct database access.

## When NOT to use

- When a simpler built-in solution exists for your specific use case
- If you are not using Convex as your backend
- When the functionality provided by Analytics is not needed

## Troubleshooting

**How does @vllnt/convex-analytics keep aggregate reads fast as event volume grows?**

@vllnt/convex-analytics uses a rollup-on-write strategy: every call to analytics.track() immediately increments counters per dimension value and time bucket, backed by @convex-dev/aggregate and @convex-dev/sharded-counter. The metric(), top(), and timeseries() queries read those pre-aggregated counters, so their cost is O(1) regardless of how many raw events have been ingested.

**What analytics queries does @vllnt/convex-analytics support?**

@vllnt/convex-analytics provides metric (total count over a range), top (dimension breakdowns), timeseries (bucketed counts), uniques (DAU/WAU/MAU), funnel (ordered step conversion by subjectRef), retention (cohort return rates), distribution (histogram of a numeric measure), and list (paginated raw events). metric, top, and timeseries read pre-aggregated rollups kept forever; funnel, retention, and distribution read TTL-pruned raw events via indexes.

**Can I use @vllnt/convex-analytics for non-web use cases like mobile or backend product events?**

The core of @vllnt/convex-analytics is domain-neutral and has no hardcoded web fields. You declare your own prop keys as dimensions, pass an optional propsValidator to type them at the boundary, and the component rolls up on whatever keys you specify. Web-specific dimensions and helpers are isolated in the opt-in @vllnt/convex-analytics/web preset.

**How does @vllnt/convex-analytics handle auth and multi-tenancy?**

@vllnt/convex-analytics is auth-agnostic: the host application gates access and passes opaque subjectRef and sessionRef values into track(). Tables are sandboxed so the host reaches them only through exported functions. Multi-tenancy is handled with the scope config option, which partitions one tenant's data from another without any additional schema work.

**What happens to raw events over time and can rollup data be lost?**

Raw events are pruned after a configurable retentionDays period (default 90 days), enforced by a cron configured via analytics.configure(). Rollup counters for metric(), top(), and timeseries() are kept indefinitely and are not affected by raw event pruning. Queries like funnel() and retention() that rely on raw events are bounded by the retention window.

## Resources

- [npm package](https://www.npmjs.com/package/%40vllnt%2Fconvex-analytics)
- [GitHub repository](https://github.com/vllnt/convex-analytics)
- [Live demo](https://vllnt.com/)
- [Convex Components Directory](https://www.convex.dev/components/vllnt/convex-analytics)
- [Convex documentation](https://docs.convex.dev)