import { parseDate } from '@internationalized/date';

import { PICKUP_TIME_ZONE } from '../config.js';

export function formatPickupDate(value: string): string {
	try {
		return new Intl.DateTimeFormat('es-MX', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			timeZone: PICKUP_TIME_ZONE
		}).format(parseDate(value).toDate(PICKUP_TIME_ZONE));
	} catch {
		return '';
	}
}
