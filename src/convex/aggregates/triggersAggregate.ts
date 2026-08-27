// LIBRARIES
import { Triggers } from 'convex-helpers/server/triggers';

// AGGREGATES
import { orderFilterAggregate } from '../tables/orders/aggregates/orderFilterAggregate.js';
import { userOrderFilterAggregate } from '../tables/orders/aggregates/userOrderFilterAggregate.js';
import { productCategoryFilterAggregate } from '../tables/productCategories/aggregates/productCategoryFilterAggregate.js';
import { productVariantFilterAggregate } from '../tables/productVariants/aggregates/productVariantFilterAggregate.js';
import { productFilterAggregate } from '../tables/products/aggregates/productFilterAggregate.js';
import { rewardLedgerFilterAggregate } from '../tables/rewardLedger/aggregates/rewardLedgerFilterAggregate.js';

// COUNTERS
import { orderTotalCounter } from '../tables/orders/counters/orderTotalCounter.js';
import { userOrderTotalCounter } from '../tables/orders/counters/userOrderTotalCounter.js';
import { productCategoryTotalCounter } from '../tables/productCategories/counters/productCategoryTotalCounter.js';
import { rewardEligibleVariantTotalCounter } from '../tables/productVariants/counters/rewardEligibleVariantTotalCounter.js';
import { productTotalCounter } from '../tables/products/counters/productTotalCounter.js';
import { rewardLedgerTotalCounter } from '../tables/rewardLedger/counters/rewardLedgerTotalCounter.js';

// TYPES
import type { DataModel, Doc } from '../_generated/dataModel.js';

const aggregateTriggers = new Triggers<DataModel>();

aggregateTriggers.register('products', productFilterAggregate.idempotentTrigger());
aggregateTriggers.register('products', async (ctx, change) => {
	if (change.operation === 'insert') await productTotalCounter.inc(ctx, 'all');
	if (change.operation === 'delete') await productTotalCounter.dec(ctx, 'all');
});

aggregateTriggers.register('productCategories', productCategoryFilterAggregate.idempotentTrigger());
aggregateTriggers.register('productCategories', async (ctx, change) => {
	if (change.operation === 'insert') await productCategoryTotalCounter.inc(ctx, 'all');
	if (change.operation === 'delete') await productCategoryTotalCounter.dec(ctx, 'all');
});

aggregateTriggers.register('productVariants', productVariantFilterAggregate.idempotentTrigger());
aggregateTriggers.register('productVariants', async (ctx, change) => {
	const oldEligible = change.oldDoc?.rewardEligible === true;
	const newEligible = change.newDoc?.rewardEligible === true;

	if (oldEligible === newEligible) return;
	if (oldEligible) await rewardEligibleVariantTotalCounter.dec(ctx, 'rewardEligible');
	if (newEligible) await rewardEligibleVariantTotalCounter.inc(ctx, 'rewardEligible');
});

aggregateTriggers.register('orders', orderFilterAggregate.idempotentTrigger());
aggregateTriggers.register('orders', userOrderFilterAggregate.idempotentTrigger());
aggregateTriggers.register('orders', async (ctx, change) => {
	const isCounted = (status: Doc<'orders'>['status'] | undefined) =>
		status !== undefined && status !== 'draft';
	const oldCounted = isCounted(change.oldDoc?.status);
	const newCounted = isCounted(change.newDoc?.status);

	if (oldCounted !== newCounted) {
		if (oldCounted) await orderTotalCounter.dec(ctx, 'all');
		if (newCounted) await orderTotalCounter.inc(ctx, 'all');
	}

	const oldUserId =
		oldCounted && typeof change.oldDoc?.userId === 'string' ? change.oldDoc.userId : undefined;
	const newUserId =
		newCounted && typeof change.newDoc?.userId === 'string' ? change.newDoc.userId : undefined;

	if (oldUserId === newUserId) return;
	if (oldUserId) await userOrderTotalCounter.dec(ctx, oldUserId);
	if (newUserId) await userOrderTotalCounter.inc(ctx, newUserId);
});

aggregateTriggers.register('rewardLedger', rewardLedgerFilterAggregate.idempotentTrigger());
aggregateTriggers.register('rewardLedger', async (ctx, change) => {
	const oldUserId = change.oldDoc?.userId;
	const newUserId = change.newDoc?.userId;

	if (oldUserId === newUserId) return;
	if (oldUserId) await rewardLedgerTotalCounter.dec(ctx, oldUserId);
	if (newUserId) await rewardLedgerTotalCounter.inc(ctx, newUserId);
});

export { aggregateTriggers };
