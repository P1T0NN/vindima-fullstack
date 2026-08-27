// TYPES
import type { ActiveFilters } from '../../shared/features/filters/types/filterTypes.js';
import type {
	ConvexFilter,
	FilterPredicateFor
} from '../../shared/features/filters/types/filterTypesConvex.js';

/**
 * Resolve symbolic client filters into known, indexable fragments. Unknown
 * keys and values are ignored; raw field names and operators never cross the
 * boundary from the client.
 */
export function buildFilterWhere(
	predicateFor: FilterPredicateFor | undefined,
	filters?: ActiveFilters
): ConvexFilter[] {
	if (!predicateFor || !filters) return [];

	const parts: ConvexFilter[] = [];
	for (const [key, value] of Object.entries(filters)) {
		if (!value) continue;
		const predicate = predicateFor(key, value);
		if (predicate) parts.push(predicate);
	}
	return parts;
}
