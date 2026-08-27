/** Append a page while preventing duplicate keyed pagination items. */
export function appendUniquePaginationItems<Item>(
	existing: Item[],
	incoming: Item[],
	getItemKey?: (item: Item) => string | undefined
): Item[] {
	if (getItemKey === undefined) return [...existing, ...incoming];

	const seen = new Set<string>();

	for (const item of existing) {
		const key = getItemKey(item);
		if (key !== undefined) seen.add(key);
	}

	const data = [...existing];
	for (const item of incoming) {
		const key = getItemKey(item);
		if (key !== undefined) {
			if (seen.has(key)) continue;
			seen.add(key);
		}
		data.push(item);
	}

	return data;
}
