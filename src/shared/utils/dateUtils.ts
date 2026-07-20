/** Locale-aware long date, e.g. "18 June 2026". */
export function formatLongDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/**
 * Format a timestamp (epoch number or ISO string) as a locale-formatted
 * date/time. Returns an em-dash for unparseable input so callers can render
 * the result directly without re-checking validity.
 */
export function formatTs(ts: number | string): string {
	const d = new Date(ts);
	return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}
