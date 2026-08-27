// SVELTEKIT IMPORTS
import { isHttpError } from '@sveltejs/kit';

// TYPES
import type { SearchInputItem, SearchInputResultPayload } from './types.js';

export function filterSearchInputItems(
	items: SearchInputItem[],
	search: string,
	maxResults: number,
	filter?: (item: SearchInputItem, search: string) => boolean
): SearchInputItem[] {
	const trimmed = search.trim().toLowerCase();
	if (!trimmed) return [];

	const matches = filter
		? items.filter((item) => filter(item, trimmed))
		: items.filter((item) => {
				const searchableText = [item.title, item.description, item.category]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();

				return searchableText.includes(trimmed);
			});

	return matches.slice(0, maxResults);
}

export function mapSearchInputResults<TRow>(
	data: SearchInputResultPayload<TRow> | undefined,
	mapItem: ((row: TRow) => SearchInputItem) | undefined,
	maxResults: number
): SearchInputItem[] {
	if (!data) return [];

	if (Array.isArray(data)) {
		return mapItem
			? data.map((row) => mapItem(row as TRow)).slice(0, maxResults)
			: (data as SearchInputItem[]).slice(0, maxResults);
	}

	const rows = data.page ?? [];
	const mapped = mapItem ? rows.map(mapItem) : (rows as unknown as SearchInputItem[]);

	return mapped.slice(0, maxResults);
}

export function getSearchInputErrorMessage(error: unknown): string {
	if (isHttpError(error)) {
		const body: unknown = error.body;
		if (typeof body === 'string' && body.trim()) return body;
		if (typeof body === 'object' && body !== null && 'message' in body) {
			const message = (body as { message?: unknown }).message;
			if (typeof message === 'string' && message.trim()) return message;
		}
	}

	if (error instanceof Error && error.message.trim()) return error.message;
	if (typeof error === 'string' && error.trim()) return error;

	return 'No se pudo completar la búsqueda.';
}
