// CONFIG
import { PICKUP_TIME_SLOTS } from '../config.js';

export function setPickupTimeBlocked(
	blockedTimes: readonly string[],
	time: string,
	blocked: boolean
): string[] {
	const next = new Set(blockedTimes);
	if (blocked) next.add(time);
	else next.delete(time);

	return PICKUP_TIME_SLOTS.filter((slot) => next.has(slot));
}
