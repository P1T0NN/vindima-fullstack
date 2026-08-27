// TYPES
import type {
	ConvexFilter,
	ConvexFilterScalar,
	FilterPredicate
} from '../types/filterTypesConvex.js';
import type { NumberBucket } from '../types/filterTypes.js';

/** Equality against a stored field. */
export function eqColumn(field: string): FilterPredicate {
	return (value) => (value ? { field, eq: value } : undefined);
}

/** Equality where a symbolic option maps to a stored scalar value. */
export function eqMap<T extends ConvexFilterScalar>(
	field: string,
	map: Record<string, T>
): FilterPredicate {
	return (value) => {
		if (!Object.prototype.hasOwnProperty.call(map, value)) return undefined;
		return { field, eq: map[value] } satisfies ConvexFilter;
	};
}

export function numberBuckets(field: string, buckets: readonly NumberBucket[]): FilterPredicate {
	return (value) => {
		const bucket = buckets.find((candidate) => candidate.value === value);
		if (!bucket) return undefined;
		return { field, gte: bucket.min, lt: bucket.max } satisfies ConvexFilter;
	};
}

/** Relative date bucket whose lower bound is evaluated for each query. */
export type DateBucket = { value: string; from: () => number };

export function dateBuckets(field: string, buckets: readonly DateBucket[]): FilterPredicate {
	return (value) => {
		const bucket = buckets.find((candidate) => candidate.value === value);
		return bucket ? { field, gte: bucket.from() } : undefined;
	};
}
