// LIBRARIES
import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import r2 from '@convex-dev/r2/convex.config.js';
import analytics from '@vllnt/convex-analytics/convex.config';
import aggregate from '@convex-dev/aggregate/convex.config.js';
import betterAuth from './auth/component/convex.config';

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(r2);
app.use(analytics);
// One component instance per counter (each is its own B-tree). Register a new one here for
// every surface that needs exact counts or page jumps at scale, then declare its
// `counter(...)` entry in `counters.ts` — the trigger comes with it.
// O(log n) live order counters for the dashboard work queue (orders by bucket).
app.use(aggregate, { name: 'orderCounts' });
// Creation-time B-tree over real (non-draft) orders — exact totals + O(log n) page jumps
// for the /admin/orders browse at any order volume. See `counters.ts`.
app.use(aggregate, { name: 'orderBrowse' });

export default app;
