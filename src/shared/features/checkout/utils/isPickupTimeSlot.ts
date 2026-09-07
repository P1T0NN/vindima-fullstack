import { getPickupTimeSlots, PICKUP_TIME_SLOTS } from '../config.js';

export function isPickupTimeSlot(value: string, date?: string): boolean {
	return (date ? getPickupTimeSlots(date) : PICKUP_TIME_SLOTS).includes(value);
}
