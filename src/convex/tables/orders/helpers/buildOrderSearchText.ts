// The single source of the orders `searchText` blob — used at placement so the admin
// table's `search_text` index can match on order number OR customer name/email.
// Keep every writer going through here so the indexed text never drifts from its parts.

export function buildOrderSearchText(o: { number: string; name: string; email: string }): string {
	return `${o.number} ${o.name} ${o.email}`.trim();
}
