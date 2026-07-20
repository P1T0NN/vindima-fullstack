// Runnable self-check for the pure checkout math (no test framework — the repo has none).
// Run: `bun src/shared/features/checkout/utils/checkoutUtils.check.ts`.
// Covers CheckoutPageSystemDesign.md §14 (shipping fee, free-above boundary, total, status map).
//
// NOTE: asserts the SHIPPED template defaults (FEE 5000, FREE_ABOVE 50000, DELIVERY enabled).
// If a project retunes CHECKOUT_CONFIG, update the expected numbers here alongside it.

import assert from 'node:assert/strict';
import { shippingFeeMinor, orderTotalMinor, orderDisplayStatus } from './checkoutUtils.ts';

// Pickup is always free, regardless of subtotal.
assert.equal(shippingFeeMinor('pickup', 0), 0);
assert.equal(shippingFeeMinor('pickup', 999999), 0);

// Delivery below the free-above threshold pays the flat fee.
assert.equal(shippingFeeMinor('delivery', 0), 5000);
assert.equal(shippingFeeMinor('delivery', 49999), 5000);
// Exactly at the threshold → free (>=).
assert.equal(shippingFeeMinor('delivery', 50000), 0);
assert.equal(shippingFeeMinor('delivery', 80000), 0);

// Total = subtotal - discount + shipping, floored at 0.
assert.equal(orderTotalMinor(12000, 0, 0), 12000);
assert.equal(orderTotalMinor(12000, 1200, 5000), 15800); // 10% off + shipping
assert.equal(orderTotalMinor(12000, 1200, 0), 10800);
assert.equal(orderTotalMinor(1000, 5000, 0), 0); // discount never drives it negative

// Display-status mapping (spec §4.2).
assert.equal(orderDisplayStatus('pending', null), 'processing');
assert.equal(orderDisplayStatus('paid', null), 'processing');
assert.equal(orderDisplayStatus('paid', 'processing'), 'processing');
assert.equal(orderDisplayStatus('paid', 'shipped'), 'shipped');
assert.equal(orderDisplayStatus('paid', 'delivered'), 'delivered');
assert.equal(orderDisplayStatus('cancelled', null), 'cancelled');
assert.equal(orderDisplayStatus('refunded', null), 'cancelled');

console.log('checkoutUtils.check.ts: all assertions passed');
