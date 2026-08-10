/** Trim; empty or whitespace-only → `undefined`. Safe for optional form/API fields. */
export function trimToUndefined(value: string | undefined | null): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/** Capitalizes only the first character of a string. Returns the input unchanged when empty. */
export function capitalizeFirst(s: string): string {
	return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
