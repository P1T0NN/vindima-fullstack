import { PICKUP_TIME_SLOTS } from '../config.js';

export function isPickupTimeSlot(value: string): boolean {
	return PICKUP_TIME_SLOTS.includes(value);
}
