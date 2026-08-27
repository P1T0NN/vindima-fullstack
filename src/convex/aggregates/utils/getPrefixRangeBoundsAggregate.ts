// LIBRARIES
import type { Bounds } from '@convex-dev/aggregate';
import type { Value as ConvexValue } from 'convex/values';

const MIN_FINITE_NUMBER = -Number.MAX_VALUE;
const MAX_FINITE_NUMBER = Number.MAX_VALUE;

export type NumericAggregateKey<Prefix extends ConvexValue[]> = [...Prefix, number];

export type NumericRangeAggregate = {
	from?: number;
	to?: number;
};

/** Build a prefix bound or a bounded numeric range inside that prefix. */
export function getPrefixRangeBoundsAggregate<Prefix extends ConvexValue[], ID extends string>(
	prefix: Prefix,
	range?: NumericRangeAggregate
): Bounds<NumericAggregateKey<Prefix>, ID> {
	const from = range?.from;
	const to = range?.to;

	if (from !== undefined && !Number.isFinite(from)) {
		throw new Error('Aggregate range start must be finite');
	}
	if (to !== undefined && !Number.isFinite(to)) {
		throw new Error('Aggregate range end must be finite');
	}
	if (from !== undefined && to !== undefined && from > to) {
		throw new Error('Aggregate range start must not exceed its end');
	}

	if (from === undefined && to === undefined) {
		// SAFETY: The prefix is a valid leading tuple segment for the numeric aggregate key.
		return { prefix } as Bounds<NumericAggregateKey<Prefix>, ID>;
	}

	return {
		lower: {
			// SAFETY: Appending a validated finite number preserves the aggregate key shape.
			key: [...prefix, from ?? MIN_FINITE_NUMBER] as NumericAggregateKey<Prefix>,
			inclusive: true
		},
		upper: {
			// SAFETY: Appending a validated finite number preserves the aggregate key shape.
			key: [...prefix, to ?? MAX_FINITE_NUMBER] as NumericAggregateKey<Prefix>,
			inclusive: true
		}
	};
}
