// LIBRARIES
import { type ReturnValueForOptionalValidator } from 'convex/server';
import { v, type GenericValidator, type ObjectType, type PropertyValidators } from 'convex/values';

// CONVEX
import { adminQuery, authenticatedQuery } from '../builders/convexFunctionBuilders.js';
import { query as rawQuery, type QueryCtx } from '../_generated/server.js';

// CONFIG
import { SEARCH_DATA } from '../../shared/features/search/config.js';

const searchQueryArgs = {
	search: v.string()
};

type CombinedArgsValidator<SpecificArgsValidator extends PropertyValidators> =
	typeof searchQueryArgs & SpecificArgsValidator;

type SearchQueryArgs<SpecificArgsValidator extends PropertyValidators> =
	ObjectType<SpecificArgsValidator> & { search: string };

type RequiredValidator = GenericValidator & { isOptional: 'required' };

type FetchOptimizedSearchQueryOptions<
	ArgsValidator extends PropertyValidators,
	ReturnsValidator extends RequiredValidator,
	T
> = {
	auth?: 'user' | 'admin';
	args?: ArgsValidator;
	returns: ReturnsValidator;
	fetchResults: (args: {
		ctx: QueryCtx;
		search: string;
		limit: number;
		args: SearchQueryArgs<ArgsValidator>;
	}) => T[] | Promise<T[]>;
};

/** Register a Convex search query with normalized, bounded suggestions. */
export function fetchOptimizedSearchQuery<
	ArgsValidator extends PropertyValidators = {},
	ReturnsValidator extends RequiredValidator = RequiredValidator,
	T = unknown
>(options: FetchOptimizedSearchQueryOptions<ArgsValidator, ReturnsValidator, T>) {
	// SAFETY: The wrapper owns these validated arguments and merges the search validator.
	const args = {
		...options.args,
		...searchQueryArgs
	} as CombinedArgsValidator<ArgsValidator>;

	const run = async (ctx: QueryCtx, queryArgs: SearchQueryArgs<ArgsValidator>) => {
		const search = queryArgs.search.trim().toLowerCase();
		if (search.length < SEARCH_DATA.MIN_QUERY_LENGTH) {
			// SAFETY: Search queries are configured with an array return validator; an empty result is valid.
			return [] as ReturnValueForOptionalValidator<ReturnsValidator>;
		}

		const results = await options.fetchResults({
			ctx,
			search,
			limit: SEARCH_DATA.DROPDOWN_LIMIT,
			args: queryArgs
		});

		// SAFETY: The configured returns validator validates this result at runtime.
		return results.slice(
			0,
			SEARCH_DATA.DROPDOWN_LIMIT
		) as ReturnValueForOptionalValidator<ReturnsValidator>;
	};

	const handler = (ctx: QueryCtx, handlerArgs: ObjectType<CombinedArgsValidator<ArgsValidator>>) =>
		run(
			ctx,
			handlerArgs as SearchQueryArgs<ArgsValidator>
		) as ReturnValueForOptionalValidator<ReturnsValidator>;

	if (options.auth === 'admin') {
		return adminQuery({
			args,
			returns: options.returns,
			handler
		});
	}

	if (options.auth === 'user') {
		return authenticatedQuery({
			args,
			returns: options.returns,
			handler
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
		handler
	});
}
