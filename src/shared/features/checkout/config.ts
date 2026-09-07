import { parseDate } from '@internationalized/date';
import { COMPANY_DATA } from '../../config.js';

export const PICKUP_TIME_ZONE = 'America/Mexico_City';

const WEEKDAYS = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
] as const;

function toMinutes(value: string): number {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
}

function toTime(totalMinutes: number): string {
	const hour = Math.floor(totalMinutes / 60);
	const minute = totalMinutes % 60;
	return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

function slotsForHours(opens: string, closes: string): string[] {
	const firstSlot = toMinutes(opens);
	const lastSlot = toMinutes(closes) - 15;
	const slots: string[] = [];

	for (let totalMinutes = firstSlot; totalMinutes <= lastSlot; totalMinutes += 30) {
		slots.push(toTime(totalMinutes));
	}

	const finalSlot = toTime(lastSlot);
	if (slots.at(-1) !== finalSlot) slots.push(finalSlot);
	return slots;
}

const pickupTimeSlotsByWeekday = WEEKDAYS.reduce<Record<number, readonly string[]>>(
	(slots, weekdayName, weekday) => {
		const hours = COMPANY_DATA.HOURS.find((entry) =>
			entry.SCHEMA_DAYS.some((day) => day === weekdayName)
		);
		slots[weekday] = hours ? slotsForHours(hours.OPENS, hours.CLOSES) : [];
		return slots;
	},
	{}
);

export const PICKUP_TIME_SLOTS_BY_WEEKDAY = pickupTimeSlotsByWeekday;
export const PICKUP_TIME_SLOTS = [
	...new Set(Object.values(PICKUP_TIME_SLOTS_BY_WEEKDAY).flat())
].sort();

export function getPickupTimeSlots(date: string): readonly string[] {
	try {
		const weekday = parseDate(date).toDate('UTC').getUTCDay();
		return PICKUP_TIME_SLOTS_BY_WEEKDAY[weekday] ?? [];
	} catch {
		return [];
	}
}

export const PICKUP_OPEN_WEEKDAYS = new Set(
	Object.entries(PICKUP_TIME_SLOTS_BY_WEEKDAY)
		.filter(([, slots]) => slots.length > 0)
		.map(([weekday]) => Number(weekday))
);
