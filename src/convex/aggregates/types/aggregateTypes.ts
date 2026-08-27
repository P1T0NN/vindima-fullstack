// TYPES
import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx } from 'convex/server';

type MutationContext = Pick<GenericMutationCtx<GenericDataModel>, 'runMutation'>;

export type AggregateQueryContext = Pick<GenericQueryCtx<GenericDataModel>, 'runQuery'>;

export type CounterAggregate = {
	inc(ctx: MutationContext, delta: number): Promise<void>;
	read(ctx: AggregateQueryContext): Promise<number>;
};
