export function hasErrorMessage(data: unknown): data is { message: string } {
	const message = (data as { message?: unknown } | null | undefined)?.message;
	return typeof message === 'string';
}
