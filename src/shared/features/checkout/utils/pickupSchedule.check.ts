import assert from 'node:assert/strict';
import { getPickupTimeSlots, PICKUP_TIME_SLOTS, PICKUP_TIME_ZONE } from '../config.js';
import { orderDeliverySchema, placeOrderFormSchema } from '../../orders/schemas/ordersSchemas.js';
import { formatPickupDate } from './formatPickupDate.js';
import { isPickupDate } from './isPickupDate.js';
import { isPickupTimeSlot } from './isPickupTimeSlot.js';
import { setPickupTimeBlocked } from './setPickupTimeBlocked.js';

if (
	PICKUP_TIME_SLOTS.length !== 19 ||
	PICKUP_TIME_SLOTS[0] !== '13:30' ||
	PICKUP_TIME_SLOTS.at(-1) !== '22:30' ||
	getPickupTimeSlots('2099-01-06').at(-1) !== '21:00' ||
	getPickupTimeSlots('2099-01-07')[0] !== '15:00' ||
	getPickupTimeSlots('2099-01-08').at(-1) !== '22:30' ||
	getPickupTimeSlots('2099-01-11').at(-1) !== '18:00' ||
	!isPickupDate('2099-01-06') ||
	isPickupDate('2099-01-05') ||
	!isPickupTimeSlot('21:00', '2099-01-06') ||
	isPickupTimeSlot('21:15', '2099-01-06') ||
	isPickupTimeSlot('22:45', '2099-01-11')
) {
	throw new Error('Pickup schedule check failed');
}

const schedule = [
	['2026-09-14', null, null, 0, '13:00', '23:00'],
	['2026-09-15', '13:30', '21:00', 16, '13:00', '21:15'],
	['2026-09-16', '15:00', '21:00', 13, '14:30', '21:15'],
	['2026-09-17', '13:30', '22:30', 19, '13:00', '23:00'],
	['2026-09-18', '13:30', '22:30', 19, '13:00', '23:00'],
	['2026-09-19', '13:30', '18:00', 10, '13:00', '18:30'],
	['2026-09-20', '13:30', '18:00', 10, '13:00', '18:30']
] as const;
const originalNow = Date.now;
try {
	assert.equal(PICKUP_TIME_ZONE, 'America/Mexico_City');
	for (const [date, first, last, count, opens, closes] of schedule) {
		Date.now = () => Date.parse(`${date}T12:00:00-06:00`);
		const slots = getPickupTimeSlots(date);
		assert.equal(isPickupDate(date), count > 0, `Same-day availability: ${date}`);
		assert.equal(slots.length, count, date);
		assert.equal(slots[0] ?? null, first, date);
		assert.equal(slots.at(-1) ?? null, last, date);
		for (const [index, time] of slots.entries()) {
			const minutes = (value: string) => {
				const [hour, minute] = value.split(':').map(Number);
				return hour * 60 + minute;
			};
			if (index > 0) assert.equal(minutes(time) - minutes(slots[index - 1]), 30);
			assert.ok(
				orderDeliverySchema.safeParse({ kind: 'pickup', pickupDate: date, pickupTime: time })
					.success
			);
		}
		for (const time of [opens, closes, '12:30', '13:15', '21:15', '22:45', '23:30']) {
			assert.equal(
				orderDeliverySchema.safeParse({ kind: 'pickup', pickupDate: date, pickupTime: time })
					.success,
				false
			);
		}
	}
	// UTC is already Thursday, but it is still Wednesday in Mexico City.
	Date.now = () => Date.parse('2026-09-17T05:59:59Z');
	assert.ok(isPickupDate('2026-09-16'));
	assert.equal(isPickupDate('2026-09-15'), false);
	Date.now = () => Date.parse('2026-09-17T06:00:00Z');
	assert.equal(isPickupDate('2026-09-16'), false);
	assert.ok(isPickupDate('2026-09-17'));
	assert.equal(isPickupDate('not-a-date'), false);
} finally {
	Date.now = originalNow;
}

if (!formatPickupDate('2099-01-06') || formatPickupDate('not-a-date') !== '') {
	throw new Error('Pickup date format check failed');
}

const validPickup = {
	name: 'Ana',
	email: 'ana@example.com',
	phone: '449 000 0000',
	payment: 'online',
	pickupDate: '2099-01-06',
	pickupTime: '21:00',
	note: ''
};
const missingPhone = placeOrderFormSchema.safeParse({ ...validPickup, phone: '' });
const missingSchedule = placeOrderFormSchema.safeParse({
	...validPickup,
	pickupDate: '',
	pickupTime: ''
});

if (
	!placeOrderFormSchema.safeParse(validPickup).success ||
	missingPhone.success ||
	!missingPhone.error.issues.some(({ path }) => path[0] === 'phone') ||
	missingSchedule.success ||
	!missingSchedule.error.issues.some(({ path }) => path[0] === 'pickupDate') ||
	!missingSchedule.error.issues.some(({ path }) => path[0] === 'pickupTime')
) {
	throw new Error('Checkout validation check failed');
}

if (
	JSON.stringify(setPickupTimeBlocked([], '14:00', true)) !== JSON.stringify(['14:00']) ||
	JSON.stringify(setPickupTimeBlocked(['14:00'], '14:00', true)) !== JSON.stringify(['14:00']) ||
	JSON.stringify(setPickupTimeBlocked(['14:00', '14:30'], '14:00', false)) !==
		JSON.stringify(['14:30'])
) {
	throw new Error('Pickup availability check failed');
}

console.log('Pickup schedule checks passed');
