import { parseDate, today } from '@internationalized/date';
import { PICKUP_OPEN_WEEKDAYS, PICKUP_TIME_ZONE } from '../config.js';

export function isPickupDate(value: string): boolean {
	try {
		const date = parseDate(value);
		const weekday = date.toDate('UTC').getUTCDay();
		return PICKUP_OPEN_WEEKDAYS.has(weekday) && date.compare(today(PICKUP_TIME_ZONE)) >= 0;
	} catch {
		return false;
	}
}
