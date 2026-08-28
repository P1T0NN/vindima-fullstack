export function formatPickupTime(value: string): string {
	const [hour, minute] = value.split(':').map(Number);
	return new Intl.DateTimeFormat('es-MX', {
		hour: 'numeric',
		minute: '2-digit',
		timeZone: 'UTC'
	}).format(new Date(Date.UTC(1970, 0, 1, hour, minute)));
}
