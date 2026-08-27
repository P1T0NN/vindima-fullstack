/**
 * `state` — the term lives in local `$state`; the URL is untouched. Use for
 * admin/authed pages where URL noise is unwanted.
 *
 * `url` — the term reads/writes a search param (`?q=…` by default). SSR-readable
 * (the server renders filtered results for crawlers), shareable, back/forward
 * friendly. Use for public/SEO pages.
 */
export type SearchMode = 'state' | 'url';

export type SearchOptions = {
	mode?: SearchMode;
	/** URL param name when `mode === 'url'`. Default `'q'`. */
	param?: string;
	/** Minimum character count (after trim) before a search fires. Default `2`. */
	minChars?: number;
	/** Debounce delay in ms between keystrokes. Default `300`. */
	debounceMs?: number;
};

export type SearchApi = {
	/** Raw input value — bind it (`bind:value={search.value}`). */
	get value(): string;
	set value(v: string);
	/**
	 * Effective term: debounced + trimmed, `''` when below `minChars`. Bake this
	 * into the query AND pass it as the component's `search` prop.
	 */
	get term(): string;
	/** True when `term` is non-empty — the search is actually active. */
	get isActive(): boolean;
	clear(): void;
};
