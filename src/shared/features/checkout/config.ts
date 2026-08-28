export const PICKUP_TIME_ZONE = 'America/Mexico_City';

export const PICKUP_TIME_SLOTS = Array.from({ length: 16 }, (_, index) => {
	const totalMinutes = 13 * 60 + 30 + index * 30;
	const hour = Math.floor(totalMinutes / 60);
	const minute = totalMinutes % 60;
	return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
});

export const PICKUP_OPEN_WEEKDAYS = new Set([0, 2, 3, 4, 5, 6]);
