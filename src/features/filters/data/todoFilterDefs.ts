// TYPES
import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

/**
 * The demo filter schema for the `tasks` listing — the concrete options each
 * filter column exposes. `key` is the contract with the server predicate
 * registry (`buildFilterWhere`): the client only ever sends these symbolic
 * option values, never column names or operators.
 *
 * `status` maps onto the Convex `done` boolean; `price` maps onto the
 * materialized `priceBand`, and `date` maps onto indexed `createdAt`.
 */
export const TODO_FILTER_DEFS = [
	{
		key: 'status',
		label: 'Status',
		options: [
			{ value: '', label: 'All statuses' },
			{ value: 'done', label: 'Done' },
			{ value: 'pending', label: 'Pending' }
		]
	},
	{
		key: 'price',
		label: 'Price',
		options: [
			{ value: '', label: 'Any price' },
			{ value: 'lt50', label: 'Under $50' },
			{ value: '50to100', label: '$50 – $100' },
			{ value: 'gt100', label: '$100+' }
		]
	},
	{
		key: 'date',
		label: 'Date',
		options: [
			{ value: '', label: 'Any time' },
			{ value: 'today', label: 'Today' },
			{ value: '7d', label: 'Last 7 days' },
			{ value: '30d', label: 'Last 30 days' }
		]
	}
] satisfies FilterDef[];
