// LIBRARIES
import { analytics } from '../../analytics/analytics.config';

// TYPES
import type { CounterAggregate } from '../types/aggregateTypes';

export function createCounterAggregate(key: string): CounterAggregate {
	const added = `${key}:added`;
	const removed = `${key}:removed`;

	return {
		async inc(ctx, delta) {
			if (!Number.isSafeInteger(delta)) {
				throw new Error('Counter delta must be a safe integer');
			}
			if (delta === 0) return;

			const event = delta > 0 ? added : removed;
			for (let index = 0; index < Math.abs(delta); index += 1) {
				const result = await analytics.track(ctx, event);
				if (result !== 'tracked') {
					throw new Error(`Counter event was not tracked: ${result}`);
				}
			}
		},
		async read(ctx) {
			const [created, deleted] = await Promise.all([
				analytics.metric(ctx, added),
				analytics.metric(ctx, removed)
			]);
			return created - deleted;
		}
	};
}
