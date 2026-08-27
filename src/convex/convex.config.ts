// LIBRARIES
import { defineApp } from 'convex/server';
import aggregate from '@convex-dev/aggregate/convex.config';
import rateLimiter from '@convex-dev/rate-limiter/convex.config.js';
import shardedCounter from '@convex-dev/sharded-counter/convex.config';
import migrations from '@convex-dev/migrations/convex.config';
import analytics from '@vllnt/convex-analytics/convex.config';
import r2 from '@convex-dev/r2/convex.config.js';

// COMPONENTS
import betterAuth from './betterAuth/convex.config.js';

const app = defineApp();
app.use(rateLimiter);
app.use(betterAuth);
app.use(migrations);
app.use(r2);
app.use(analytics);
app.use(shardedCounter, { name: 'productsTotalCounter' });
app.use(shardedCounter, { name: 'productCategoriesTotalCounter' });
app.use(shardedCounter, { name: 'rewardEligibleVariantsTotalCounter' });
app.use(shardedCounter, { name: 'ordersTotalCounter' });
app.use(shardedCounter, { name: 'userOrdersTotalCounter' });
app.use(shardedCounter, { name: 'rewardLedgerTotalCounter' });
app.use(aggregate, { name: 'productsFilterAggregate' });
app.use(aggregate, { name: 'productCategoriesFilterAggregate' });
app.use(aggregate, { name: 'productVariantsFilterAggregate' });
app.use(aggregate, { name: 'ordersFilterAggregate' });
app.use(aggregate, { name: 'userOrdersFilterAggregate' });
app.use(aggregate, { name: 'rewardLedgerFilterAggregate' });

export default app;
