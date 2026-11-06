import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {
	buildOrderStripeMetadata,
	STRIPE_METADATA_MAX_VALUE_LENGTH
} from '../src/convex/tables/orders/helpers/buildOrderStripeMetadata.ts';
import type { Doc, Id } from '../src/convex/_generated/dataModel.js';

// Placeholder values only — no Stripe call is ever made; signatures are computed locally.
const WEBHOOK_SECRET = 'whsec_local_check_only';
process.env.STRIPE_SECRET_KEY = 'sk_test_local_check_only';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;

const { handleStripeEvent } =
	await import('../src/convex/tables/orders/actions/handleStripeEvent.ts');
const { stripeWebhook } = await import('../src/convex/tables/orders/http/stripeWebhook.ts');

// ── Metadata ────────────────────────────────────────────────────────────────
const orderId = 'order_1' as Id<'orders'>;
const pickupOrder = {
	_id: orderId,
	number: 'ORD-TEST01',
	name: '  Ana López ',
	phone: '+52 55 0000 0000',
	note: 'x'.repeat(800),
	delivery: { kind: 'pickup' as const, pickupDate: '2026-11-05', pickupTime: '13:30' }
};
const meta = buildOrderStripeMetadata(pickupOrder);
assert.deepEqual(Object.keys(meta), [
	'orderId',
	'orderNumber',
	'pickupDate',
	'pickupTime',
	'customerName',
	'customerPhone',
	'customerNote'
]);
assert.equal(meta.orderId, orderId);
assert.equal(meta.orderNumber, 'ORD-TEST01');
assert.equal(meta.customerName, 'Ana López');
assert.equal(meta.customerNote.length, STRIPE_METADATA_MAX_VALUE_LENGTH);
assert.ok(Object.keys(meta).length <= 50);
for (const [k, val] of Object.entries(meta)) {
	assert.ok(k.length <= 40);
	assert.ok(val.length <= 500);
}
assert.deepEqual(
	buildOrderStripeMetadata({
		...pickupOrder,
		phone: undefined,
		note: '   ',
		delivery: {
			kind: 'delivery',
			address: { line1: 'a', city: 'b', postcode: 'c', country: 'MX' }
		}
	}),
	{ orderId, orderNumber: 'ORD-TEST01', customerName: 'Ana López' }
);

// ── Webhook ─────────────────────────────────────────────────────────────────
const stripe = new Stripe('sk_test_local_check_only');
const run = (
	handleStripeEvent as unknown as {
		_handler: (ctx: unknown, a: unknown) => Promise<{ status: number }>;
	}
)._handler;

function sessionEvent(type: string, session: Record<string, unknown>) {
	return JSON.stringify({ id: 'evt_1', object: 'event', type, data: { object: session } });
}
async function sign(payload: string, secret = WEBHOOK_SECRET) {
	return await stripe.webhooks.generateTestHeaderStringAsync({
		payload,
		secret,
		cryptoProvider: Stripe.createSubtleCryptoProvider()
	});
}

type Calls = { refunds: string[]; settles: number };
function fakeCtx(order: Partial<Doc<'orders'>> | null) {
	const calls: Calls = { refunds: [], settles: 0 };
	const ctx = {
		runQuery: async () => order,
		runAction: async (_ref: unknown, args: { reason: string }) => {
			calls.refunds.push(args.reason);
			return null;
		},
		runMutation: async () => {
			calls.settles++;
			return null;
		}
	};
	return { ctx, calls };
}

const paidSession = {
	id: 'cs_1',
	payment_status: 'paid',
	payment_intent: 'pi_1',
	amount_total: 1000,
	metadata: { orderId }
};
const draftOrder = {
	_id: orderId,
	status: 'draft' as const,
	paymentSessionRef: 'cs_1',
	amounts: { totalMinor: 1000 } as Doc<'orders'>['amounts']
};

// Invalid signature → 400, nothing touched.
{
	const payload = sessionEvent('checkout.session.completed', paidSession);
	const { ctx, calls } = fakeCtx(draftOrder);
	const r = await run(ctx, { payload, signature: await sign(payload, 'whsec_wrong') });
	assert.equal(r.status, 400);
	assert.deepEqual(calls, { refunds: [], settles: 0 });
}
// Missing secret → 500 (Stripe retries).
{
	const payload = sessionEvent('checkout.session.completed', paidSession);
	const signature = await sign(payload);
	delete process.env.STRIPE_WEBHOOK_SECRET;
	const { ctx } = fakeCtx(draftOrder);
	assert.equal((await run(ctx, { payload, signature })).status, 500);
	process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
}
// Missing header at the HTTP route → 400.
{
	const route = (
		stripeWebhook as unknown as { _handler: (c: unknown, r: Request) => Promise<Response> }
	)._handler;
	const res = await route(
		{},
		new Request('https://x/stripe/webhook', { method: 'POST', body: '{}' })
	);
	assert.equal(res.status, 400);
}
// Ignored event type → 200, nothing touched.
{
	const payload = sessionEvent('checkout.session.expired', paidSession);
	const { ctx, calls } = fakeCtx(draftOrder);
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: [], settles: 0 });
}
// Not yet paid (delayed method) → 200, nothing touched.
{
	const payload = sessionEvent('checkout.session.completed', {
		...paidSession,
		payment_status: 'unpaid'
	});
	const { ctx, calls } = fakeCtx(draftOrder);
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: [], settles: 0 });
}
// Happy path → settles once.
{
	const payload = sessionEvent('checkout.session.completed', paidSession);
	const { ctx, calls } = fakeCtx(draftOrder);
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: [], settles: 1 });
}
// Replay of the same payment on a paid order → 200, idempotent.
{
	const payload = sessionEvent('checkout.session.completed', paidSession);
	const { ctx, calls } = fakeCtx({ ...draftOrder, status: 'paid', paymentRef: 'pi_1' });
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: [], settles: 0 });
}
// Different payment on a paid order → refund.
{
	const payload = sessionEvent('checkout.session.completed', {
		...paidSession,
		payment_intent: 'pi_2'
	});
	const { ctx, calls } = fakeCtx({ ...draftOrder, status: 'paid', paymentRef: 'pi_1' });
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.equal(calls.refunds.length, 1);
	assert.equal(calls.settles, 0);
}
// Amount mismatch → refund, never settles.
{
	const payload = sessionEvent('checkout.session.completed', { ...paidSession, amount_total: 999 });
	const { ctx, calls } = fakeCtx(draftOrder);
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: ['amount does not match the order total'], settles: 0 });
}
// No order behind the payment → refund.
{
	const payload = sessionEvent('checkout.session.completed', paidSession);
	const { ctx, calls } = fakeCtx(null);
	assert.equal((await run(ctx, { payload, signature: await sign(payload) })).status, 200);
	assert.deepEqual(calls, { refunds: ['no matching order for paid session'], settles: 0 });
}

console.log('stripe-webhook.check: ok');
