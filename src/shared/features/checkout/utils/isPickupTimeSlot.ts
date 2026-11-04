import { getBookablePickupTimeSlots, PICKUP_TIME_SLOTS } from '../config.js';

export function isPickupTimeSlot(value: string, date?: string): boolean {
	return (date ? getBookablePickupTimeSlots(date) : PICKUP_TIME_SLOTS).includes(value);
}
