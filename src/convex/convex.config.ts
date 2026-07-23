// LIBRARIES
import { defineApp } from 'convex/server';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import r2 from '@convex-dev/r2/convex.config.js';
import analytics from '@piton-/analytics-convex/convex.config.js';
import aggregate from '@convex-dev/aggregate/convex.config.js';
import betterAuth from './auth/component/convex.config';

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(r2);
app.use(analytics);
// O(log n) live order counters for the dashboard work queue (orders by bucket).
app.use(aggregate, { name: 'orderCounts' });

export default app;
