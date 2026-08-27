// LIBRARIES
import type { Aggregate, Key } from '@convex-dev/aggregate';
import {
	paginationOptsValidator,
	type PaginationOptions,
	type ReturnValueForOptionalValidator
} from 'convex/server';
import {
	v,
	type GenericValidator,
	type ObjectType,
	type PropertyValidators,
	type Value as ConvexValue
} from 'convex/values';

// CONVEX
import { adminQuery, authenticatedQuery } from '../builders/convexFunctionBuilders.js';
import { query as rawQuery, type QueryCtx } from '../_generated/server';

// HELPERS
import { getTotalSizeAggregate } from '../aggregates/helpers/getTotalSizeAggregate.js';

// UTILS
import { buildFilterWhere } from '../utils/buildFilterWhere.js';

// TYPES
import type { UserIdentity } from 'convex/server';
import type { ConvexPaginatedPage } from '../../shared/features/pagination/types/paginationTypesConvex.js';
import type { ConvexFilter } from '../../shared/features/filters/types/filterTypesConvex.js';
import type { ActiveFilters } from '../../shared/features/filters/types/filterTypes.js';

const optimizedQueryArgs = {
	paginationOpts: paginationOptsValidator,
	search: v.optional(v.string()),
	filters: v.optional(v.record(v.string(), v.string()))
};

type OptimizedQueryContext = {
	paginationOpts: PaginationOptions;
	search?: string;
	filters?: ActiveFilters;
	now: number;
};

type CombinedArgsValidator<SpecificArgsValidator extends PropertyValidators> =
	typeof optimizedQueryArgs & SpecificArgsValidator;

type QueryContextArgs<SpecificArgsValidator extends PropertyValidators> =
	ObjectType<SpecificArgsValidator> & OptimizedQueryContext;

type RequiredValidator = GenericValidator & { isOptional: 'required' };

type FetchOptimizedQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T,
	AggregateKey extends Key,
	AggregateId extends string,
	AggregateNamespace extends ConvexValue | undefined,
	Identity extends UserIdentity | undefined
> = {
	args?: ArgsValidator;
	returns: ReturnsValidator;
	count: Aggregate<AggregateKey, AggregateId, AggregateNamespace>;
	countTotal?: (args: {
		ctx: QueryCtx;
		identity: Identity;
		args: QueryContextArgs<ArgsValidator>;
	}) => Promise<number>;
	predicateFor?: (
		key: string,
		value: string,
		args: QueryContextArgs<ArgsValidator>
	) => ConvexFilter | undefined;
	fetchPage: (args: {
		ctx: QueryCtx;
		identity: Identity;
		paginationOpts: PaginationOptions;
		search?: string;
		filters: ConvexFilter[];
		args: QueryContextArgs<ArgsValidator>;
	}) => Promise<ConvexPaginatedPage<T>>;
	filteredTotal?: 'none' | 'exact';
	countFiltered?: (args: {
		ctx: QueryCtx;
		identity: Identity;
		search?: string;
		filters: ConvexFilter[];
		args: QueryContextArgs<ArgsValidator>;
	}) => Promise<number | undefined>;
};

type PublicFetchOptimizedQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T,
	AggregateKey extends Key,
	AggregateId extends string,
	AggregateNamespace extends ConvexValue | undefined
> = FetchOptimizedQueryOptions<
	ArgsValidator,
	ReturnsValidator,
	T,
	AggregateKey,
	AggregateId,
	AggregateNamespace,
	undefined
> & { auth?: never };

type UserFetchOptimizedQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T,
	AggregateKey extends Key,
	AggregateId extends string,
	AggregateNamespace extends ConvexValue | undefined
> = FetchOptimizedQueryOptions<
	ArgsValidator,
	ReturnsValidator,
	T,
	AggregateKey,
	AggregateId,
	AggregateNamespace,
	UserIdentity
> & { auth: 'user' };

type AdminFetchOptimizedQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T,
	AggregateKey extends Key,
	AggregateId extends string,
	AggregateNamespace extends ConvexValue | undefined
> = FetchOptimizedQueryOptions<
	ArgsValidator,
	ReturnsValidator,
	T,
	AggregateKey,
	AggregateId,
	AggregateNamespace,
	UserIdentity
> & { auth: 'admin' };

/** Register an optimized Convex listing query with pagination, search, filters, and totals. */
export function fetchOptimizedQuery<
	ArgsValidator extends PropertyValidators = {},
	ReturnsValidator extends RequiredValidator = RequiredValidator,
	T = unknown,
	AggregateKey extends Key = Key,
	AggregateId extends string = string,
	AggregateNamespace extends ConvexValue | undefined = undefined
>(
	options:
		| UserFetchOptimizedQueryOptions<
				ArgsValidator,
				ReturnsValidator,
				T,
				AggregateKey,
				AggregateId,
				AggregateNamespace
		  >
		| AdminFetchOptimizedQueryOptions<
				ArgsValidator,
				ReturnsValidator,
				T,
				AggregateKey,
				AggregateId,
				AggregateNamespace
		  >
		| PublicFetchOptimizedQueryOptions<
				ArgsValidator,
				ReturnsValidator,
				T,
				AggregateKey,
				AggregateId,
				AggregateNamespace
		  >
) {
	// SAFETY: The wrapper owns these validated arguments and merges any query-specific validators.
	const args = {
		...options.args,
		...optimizedQueryArgs
	} as CombinedArgsValidator<ArgsValidator>;

	const run = async <Identity extends UserIdentity | undefined>(
		ctx: QueryCtx,
		identity: Identity,
		queryOptions: FetchOptimizedQueryOptions<
			ArgsValidator,
			ReturnsValidator,
			T,
			AggregateKey,
			AggregateId,
			AggregateNamespace,
			Identity
		>,
		args: ObjectType<CombinedArgsValidator<ArgsValidator>>
	) => {
		// SAFETY: Convex validates the merged validators before the handler runs.
		const queryArgs = {
			...args,
			now: Date.now()
		} as QueryContextArgs<ArgsValidator>;
		const search = queryArgs.search?.trim() || undefined;
		const filters = buildFilterWhere(
			queryOptions.predicateFor
				? (key, value) => queryOptions.predicateFor?.(key, value, queryArgs)
				: undefined,
			queryArgs.filters
		);
		const page = await queryOptions.fetchPage({
			ctx,
			identity,
			paginationOpts: queryArgs.paginationOpts,
			search,
			filters,
			args: queryArgs
		});

		let total: number | undefined;
		if (!search && filters.length === 0) {
			total = queryOptions.countTotal
				? await queryOptions.countTotal({ ctx, identity, args: queryArgs })
				: await getTotalSizeAggregate(ctx, queryOptions.count);
		} else if (queryOptions.filteredTotal === 'exact' && queryOptions.countFiltered) {
			total = await queryOptions.countFiltered({
				ctx,
				identity,
				search,
				filters,
				args: queryArgs
			});
		}

		// SAFETY: Optional Convex fields must be omitted, not serialized as `undefined`.
		return (
			total === undefined ? page : { ...page, total }
		) as ReturnValueForOptionalValidator<ReturnsValidator>;
	};

	if (options.auth === 'admin') {
		return adminQuery({
			args,
			returns: options.returns,
			handler: (ctx, handlerArgs) => {
				// SAFETY: Convex accepts asynchronous handlers; the configured returns validator checks the resolved value.
				return run(
					ctx,
					ctx.identity,
					options,
					handlerArgs
				) as ReturnValueForOptionalValidator<ReturnsValidator>;
			}
		});
	}

	if (options.auth === 'user') {
		return authenticatedQuery({
			args,
			returns: options.returns,
			handler: (ctx, handlerArgs) => {
				// SAFETY: Convex accepts asynchronous handlers; the configured returns validator checks the resolved value.
				return run(
					ctx,
					ctx.identity,
					options,
					handlerArgs
				) as ReturnValueForOptionalValidator<ReturnsValidator>;
			}
		});
	}

	return rawQuery<
		CombinedArgsValidator<ArgsValidator>,
		ReturnsValidator,
		ReturnValueForOptionalValidator<ReturnsValidator>,
		[args: ObjectType<CombinedArgsValidator<ArgsValidator>>]
	>({
		args,
		returns: options.returns,
		handler: (ctx, handlerArgs) => {
			// SAFETY: Convex accepts asynchronous handlers; the configured returns validator checks the resolved value.
			return run(
				ctx,
				undefined,
				options,
				handlerArgs
			) as ReturnValueForOptionalValidator<ReturnsValidator>;
		}
	});
}
