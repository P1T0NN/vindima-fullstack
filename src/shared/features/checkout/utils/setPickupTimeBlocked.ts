// CONFIG
import { PICKUP_TIME_SLOTS } from '../config.js';

export function setPickupTimeBlocked(
	blockedTimes: readonly string[],
	time: string,
	blocked: boolean,
	timeSlots: readonly string[] = PICKUP_TIME_SLOTS
): string[] {
	const next = new Set(blockedTimes);
	if (blocked) next.add(time);
	else next.delete(time);

	return timeSlots.filter((slot) => next.has(slot));
}
