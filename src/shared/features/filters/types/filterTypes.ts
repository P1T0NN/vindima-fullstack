/**
 * `state` — the filter set lives in local `$state`; the URL is untouched. Use
 * for admin/authed pages where URL noise is unwanted.
 *
 * `url` — each active filter reads/writes a search param (`?status=…&price=…`).
 * SSR-readable, shareable, back/forward friendly. Use for public/SEO pages.
 */
export type FilterMode = 'state' | 'url';

export type FilterOption = {
	/** Stable option id — URL-safe; `''` is reserved for the "All" (inactive) option. */
	value: string;
	label: string;
};

export type FilterDef = {
	/** Stable id — the URL param name and the server predicate-registry key. */
	key: string;
	/** Human label for the summary pill / aria. */
	label: string;
	/** First entry MUST be `{ value: '', label: 'All' }` — the inactive sentinel. */
	options: FilterOption[];
	placeholder?: string;
};

/** key → selected option value; entries with `''` are treated as inactive. */
export type ActiveFilters = Record<string, string>;

/** Inclusive-min / exclusive-max numeric range bucket. */
export type NumberBucket = { value: string; min?: number; max?: number };

export type FiltersOptions = {
	mode?: FilterMode;
	defs: FilterDef[];
};

export type FiltersApi = {
	defs: FilterDef[];
	/** Selected value per key (`''` when inactive). */
	value(key: string): string;
	set(key: string, value: string): void;
	/** Only non-empty entries. */
	get active(): ActiveFilters;
	get count(): number;
	get isActive(): boolean;
	/** Canonical, stable serialization (sorted keys) — the pagination reset + cache key. */
	get identity(): string;
	clear(key: string): void;
	clearAll(): void;
};
