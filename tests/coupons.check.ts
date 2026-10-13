import assert from 'node:assert/strict';
import { ConvexError } from 'convex/values';
import { calculateCouponDiscountMinor } from '../src/shared/features/coupons/utils/calculateCouponDiscountMinor.ts';
import { normalizeCouponCode } from '../src/shared/features/coupons/utils/normalizeCouponCode.ts';
import {
	saveCouponFormSchema,
	saveCouponSchema
} from '../src/shared/features/coupons/schemas/couponSchemas.ts';
import { getCouponForCheckout } from '../src/convex/tables/coupons/helpers/getCouponForCheckout.ts';
import { isSameDraftInput } from '../src/convex/tables/orders/helpers/isSameDraftInput.ts';
import { COUPONS_CONFIG } from '../src/shared/features/coupons/config.ts';
import { getCouponCustomerRef } from '../src/features/coupons/utils/getCouponCustomerRef.ts';
import {
	orderSummaryRows,
	orderSummaryText
} from '../src/convex/emails/templates/orderSummaryTable.ts';
import { calculateOrderPrice } from '../src/convex/tables/orders/helpers/calculateOrderPrice.ts';
import type { QueryCtx } from '../src/convex/_generated/server.js';
import type { MutationCtx } from '../src/convex/_generated/server.js';
import type { Doc } from '../src/convex/_generated/dataModel.js';

assert.equal(normalizeCouponCode('  save10  '), 'SAVE10');
const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
let storedCustomer: string | null = null;
try {
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: () => storedCustomer,
			setItem: (_key: string, value: string) => {
				storedCustomer = value;
			}
		}
	});
	const firstRef = getCouponCustomerRef();
	assert.ok(firstRef);
	assert.equal(getCouponCustomerRef(), firstRef);
	Object.defineProperty(globalThis, 'localStorage', {
		configurable: true,
		value: {
			getItem: () => {
				throw new Error('Blocked');
			}
		}
	});
	assert.equal(getCouponCustomerRef(), undefined);
} finally {
	if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
	else Reflect.deleteProperty(globalThis, 'localStorage');
}
assert.equal(calculateCouponDiscountMinor(999, 10), 100);
assert.equal(calculateCouponDiscountMinor(1, 99), 0);
assert.equal(calculateCouponDiscountMinor(100, 100), 99);
for (const [subtotal, percent] of [
	[0, 10],
	[-1, 10],
	[1.5, 10],
	[NaN, 10],
	[100, 0],
	[100, 101],
	[100, 1.5]
]) {
	assert.equal(calculateCouponDiscountMinor(subtotal, percent), 0);
}

const fields = {
	name: 'Offer',
	code: ' save10 ',
	percentOff: 10,
	active: true,
	onePerCustomer: false
};
assert.equal(saveCouponSchema.parse(fields).code, 'SAVE10');
assert.equal(saveCouponSchema.safeParse({ ...fields, percentOff: 100 }).success, false);
assert.equal(saveCouponSchema.safeParse({ ...fields, maxRedemptions: 1.5 }).success, false);
const parsed = saveCouponFormSchema.parse({
	...fields,
	percentOff: '10',
	minSubtotalMinor: '50.25',
	maxRedemptions: '2',
	expiresAt: '2026-10-31'
});
assert.equal(parsed.minSubtotalMinor, 5025);
assert.equal(parsed.maxRedemptions, 2);
assert.equal(parsed.expiresAt, Date.parse('2026-10-31T23:59:59.999Z'));
for (const invalid of ['-1', 'abc', 'Infinity', ' ']) {
	assert.equal(
		saveCouponFormSchema.safeParse({ ...fields, minSubtotalMinor: invalid }).success,
		false
	);
}
assert.equal(saveCouponFormSchema.safeParse({ ...fields, expiresAt: '2026-02-31' }).success, false);
assert.equal(
	saveCouponFormSchema.parse({ ...fields, minSubtotalMinor: '', maxRedemptions: '', expiresAt: '' })
		.minSubtotalMinor,
	undefined
);

type Row = Record<string, unknown>;
const coupon: Row = { ...fields, _id: 'coupon-1', code: 'SAVE10', redemptionCount: 0 };
// Indexed in-memory fixtures keep eligibility checks independent of a live deployment.
function context(
	coupon: Row | null,
	orders: Row[] = [],
	tables: Record<string, Row[]> = {}
): Pick<QueryCtx, 'db'> {
	return {
		db: {
			get: async (id: string) =>
				Object.values(tables)
					.flat()
					.find((row) => row._id === id) ?? null,
			query: (table: string) => ({
				withIndex: (_index: string, select: (range: unknown) => unknown) => {
					const predicates: ((row: Row) => boolean)[] = [];
					const range = {
						eq: (key: string, value: unknown) => {
							predicates.push((row) => row[key] === value);
							return range;
						},
						gt: (key: string, value: number) => {
							predicates.push((row) => typeof row[key] === 'number' && row[key] > value);
							return range;
						}
					};
					select(range);
					const rows = (
						table === 'coupons'
							? coupon
								? [coupon]
								: []
							: table === 'orders'
								? orders
								: (tables[table] ?? [])
					).filter((row) => predicates.every((predicate) => predicate(row)));
					return { unique: async () => rows[0] ?? null, first: async () => rows[0] ?? null };
				}
			})
		}
	} as unknown as Pick<QueryCtx, 'db'>;
}
const options = {
	code: ' save10 ',
	subtotalMinor: 10000,
	discountSubtotalMinor: 9000,
	userId: null,
	email: ' Shopper@Example.com ',
	now: 1000
};
assert.equal((await getCouponForCheckout(context(coupon), options)).discountMinor, 900);
async function rejects(row: Row | null, code: string, orders: Row[] = [], overrides = {}) {
	await assert.rejects(
		getCouponForCheckout(context(row, orders), { ...options, ...overrides }),
		(error: unknown) =>
			error instanceof ConvexError &&
			typeof error.data === 'object' &&
			error.data !== null &&
			'code' in error.data &&
			error.data.code === code
	);
}
await rejects(null, 'COUPON_NOT_FOUND');
await rejects({ ...coupon, active: false }, 'COUPON_INACTIVE');
await rejects({ ...coupon, expiresAt: 999 }, 'COUPON_EXPIRED');
assert.equal(
	(await getCouponForCheckout(context({ ...coupon, expiresAt: 1000 }), options)).discountMinor,
	900
);
await rejects({ ...coupon, minSubtotalMinor: 10001 }, 'COUPON_MIN_SUBTOTAL');
await rejects({ ...coupon, maxRedemptions: 1, redemptionCount: 1 }, 'COUPON_USAGE_LIMIT_REACHED');
const singleUse = { ...coupon, onePerCustomer: true };
await rejects(
	singleUse,
	'COUPON_ALREADY_USED',
	[
		{
			couponId: 'coupon-1',
			couponEmail: 'different@example.com',
			couponCustomerRef: 'device-1',
			settledAt: 100
		}
	],
	{ customerRef: 'device-1' }
);
await rejects(singleUse, 'COUPON_EMAIL_REQUIRED', [], { email: '' });
await rejects(singleUse, 'COUPON_ALREADY_USED', [
	{ couponId: 'coupon-1', couponEmail: 'shopper@example.com', settledAt: 100 }
]);
await rejects(
	singleUse,
	'COUPON_ALREADY_USED',
	[
		{ couponId: 'coupon-1', couponEmail: 'different@example.com', userId: 'user-1', settledAt: 100 }
	],
	{ userId: 'user-1' }
);
assert.equal(
	(
		await getCouponForCheckout(
			context(singleUse, [{ couponId: 'coupon-1', couponEmail: 'shopper@example.com' }]),
			options
		)
	).discountMinor,
	900
);
Object.assign(COUPONS_CONFIG, { COUPONS_REQUIRE_SIGN_IN: true });
try {
	await rejects(coupon, 'COUPON_SIGN_IN_REQUIRED');
} finally {
	Object.assign(COUPONS_CONFIG, { COUPONS_REQUIRE_SIGN_IN: false });
}
Object.assign(COUPONS_CONFIG, { HAS_COUPONS: false });
try {
	await rejects(coupon, 'COUPONS_DISABLED');
} finally {
	Object.assign(COUPONS_CONFIG, { HAS_COUPONS: true });
}

const order = {
	email: 'shopper@example.com',
	name: 'Shopper',
	couponCode: 'SAVE10',
	delivery: { kind: 'pickup', pickupDate: '2026-10-31', pickupTime: '14:30' },
	lines: [{ productRef: 'product', name: 'Product', qty: 1, unitPriceMinor: 10000 }],
	amounts: {
		subtotalMinor: 10000,
		welcomeDiscountMinor: 1000,
		couponDiscountMinor: 900,
		shippingMinor: 0,
		totalMinor: 8100
	},
	currency: 'MXN'
} as Doc<'orders'>;
const input = {
	contact: { name: order.name, email: order.email, phone: '' },
	delivery: order.delivery as { kind: 'pickup'; pickupDate: string; pickupTime: string },
	couponCode: ' save10 '
};
const lines = [{ productRef: 'product', qty: 1 }];
assert.equal(isSameDraftInput(order, input, lines), true);
assert.equal(isSameDraftInput(order, { ...input, couponCode: undefined }, lines), false);
assert.equal(isSameDraftInput(order, { ...input, couponCode: 'OTHER10' }, lines), false);
assert.match(orderSummaryText(order), /Cupón SAVE10:/);
assert.match(orderSummaryRows({ ...order, couponCode: '<script>' }), /Cupón &lt;script&gt;/);

const catalog = {
	productVariants: [{ ref: 'product', productId: 'product-1', available: true, priceMinor: 10000 }],
	products: [{ _id: 'product-1', name: 'Product', status: 'active', images: [] }]
};
const priceInput = {
	userId: 'user-1',
	lines,
	deliveryKind: 'pickup' as const,
	email: 'shopper@example.com',
	couponCode: 'save10'
};
const priced = await calculateOrderPrice(context(coupon, [], catalog) as MutationCtx, priceInput);
assert.equal(priced.ok, true);
if (priced.ok) {
	assert.deepEqual(priced.amounts, {
		subtotalMinor: 10000,
		welcomeDiscountMinor: 1000,
		couponDiscountMinor: 900,
		shippingMinor: 0,
		totalMinor: 8100
	});
	assert.equal(priced.couponCode, 'SAVE10');
}
const unavailable = await calculateOrderPrice(context(coupon) as MutationCtx, priceInput);
assert.deepEqual(unavailable, { ok: false, unavailableRefs: ['product'] });
const disabled = await calculateOrderPrice(
	context({ ...coupon, active: false }, [], catalog) as MutationCtx,
	priceInput
);
assert.equal(disabled.ok, false);
if (!disabled.ok) assert.equal(disabled.message, 'Este cupón está desactivado.');
const legacy = await calculateOrderPrice(context(coupon, [], catalog) as MutationCtx, {
	...priceInput,
	couponCode: undefined
});
assert.equal(legacy.ok, true);
if (legacy.ok) assert.equal(legacy.amounts.totalMinor, 9000);
console.log(
	'Coupon checks passed: normalization, money, form validation, eligibility, customer limits, pricing with welcome discounts, draft changes, receipt escaping.'
);
