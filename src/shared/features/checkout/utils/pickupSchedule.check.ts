import { PICKUP_TIME_SLOTS } from '../config.js';
import { placeOrderFormSchema } from '../../orders/schemas/ordersSchemas.js';
import { formatPickupDate } from './formatPickupDate.js';
import { isPickupDate } from './isPickupDate.js';
import { isPickupTimeSlot } from './isPickupTimeSlot.js';

if (
	PICKUP_TIME_SLOTS.length !== 16 ||
	PICKUP_TIME_SLOTS[0] !== '13:30' ||
	PICKUP_TIME_SLOTS.at(-1) !== '21:00' ||
	!isPickupDate('2099-01-06') ||
	isPickupDate('2099-01-05') ||
	!isPickupTimeSlot('21:00') ||
	isPickupTimeSlot('21:15')
) {
	throw new Error('Pickup schedule check failed');
}

if (!formatPickupDate('2099-01-06') || formatPickupDate('not-a-date') !== '') {
	throw new Error('Pickup date format check failed');
}

const validPickup = {
	name: 'Ana',
	email: 'ana@example.com',
	phone: '449 000 0000',
	mode: 'pickup',
	payment: 'online',
	line1: '',
	line2: '',
	city: '',
	postcode: '',
	country: '',
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

console.log('Pickup schedule checks passed');
