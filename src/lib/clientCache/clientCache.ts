const MAX_CACHE_SIZE = 50; // 50 entries max in the cache

/** Bounded client-side LRU for reusable query proxies or resolved data snapshots. */
export function createClientCache<T>(max = MAX_CACHE_SIZE) {
	const cache = new Map<string, T>();

	return {
		has(key: string): boolean {
			return cache.has(key);
		},
		get(key: string): T | undefined {
			const value = cache.get(key);
			if (value === undefined) return undefined;

			cache.delete(key);
			cache.set(key, value);
			return value;
		},
		set(key: string, value: T): void {
			cache.delete(key);
			cache.set(key, value);

			if (cache.size <= max) return;
			const oldestKey = cache.keys().next().value;
			if (oldestKey !== undefined) cache.delete(oldestKey);
		}
	};
}

/**
 * Hold a SvelteKit `query()` result alive across navigation. `query()` evicts a
 * cache entry once its proxy is garbage-collected, so retaining each proxy here
 * lets revisits reuse it until the bounded LRU evicts it.
 */
export function cacheQuery<const TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => TResult,
	key: (...args: TArgs) => string = (...args) => JSON.stringify(args),
	max = MAX_CACHE_SIZE
): (...args: TArgs) => TResult {
	const cache = createClientCache<TResult>(max);

	return (...args) => {
		const k = key(...args);

		if (cache.has(k)) {
			return cache.get(k)!;
		}

		const value = fn(...args);
		cache.set(k, value);
		return value;
	};
}
