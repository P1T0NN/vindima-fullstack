export function formatNameInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);

	return [parts[0]?.[0], parts.length > 1 ? parts.at(-1)?.[0] : undefined]
		.filter(Boolean)
		.join('')
		.toUpperCase();
}
