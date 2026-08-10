// One-shot counterparts to `useQuery` / `usePaginatedQuery`, matching their reactive surface
// so a component can swap between live and one-shot behind a single `realtime` prop.
//
// Why these exist: a subscription is a standing cost per mounted viewer — the server tracks the
// query's read set and re-executes on every overlapping write, billed, whether or not anyone is
// looking. `docs/GeneralSystemDesignRule.md` makes realtime opt-in for exactly that reason, but
// the Convex Svelte bindings only ship the subscribing primitives, so the cheap path had to be
// written. Args changes still refetch; what you give up is the push channel.

// LIBRARIES
import { useConvexClient } from '@mmailaender/convex-svelte';

// TYPES
import type { FunctionReference } from 'convex/server';

type AnyArgs = Record<string, unknown>;

/** Subset of `useQuery`'s return that the list components actually read. */
export type OneShotQueryReturn<T> = {
	readonly data: T | undefined;
	readonly error: Error | undefined;
	readonly isLoading: boolean;
};

/**
 * One-shot equivalent of `useQuery`: re-runs whenever `getArgs()` changes, never subscribes.
 *
 * Responses are sequence-guarded — a slow request for stale args can resolve after a newer one
 * and must not overwrite it. Without that, typing in a search box reliably ends up showing the
 * results of a query the user has already moved on from.
 */
export function convexOneShotQuery<Query extends FunctionReference<'query'>>(
	query: Query,
	getArgs: () => AnyArgs,
	options: { keepPreviousData?: boolean } = {}
): OneShotQueryReturn<Query['_returnType']> {
	const client = useConvexClient();

	let data = $state<Query['_returnType'] | undefined>(undefined);
	let error = $state<Error | undefined>(undefined);
	let isLoading = $state(true);

	// Plain counter, deliberately not `$state`: it is bookkeeping, not something to react to.
	let latest = 0;

	$effect(() => {
		const args = getArgs();
		const mine = ++latest;

		isLoading = true;
		if (!options.keepPreviousData) data = undefined;

		client
			.query(query, args)
			.then((result) => {
				if (mine !== latest) return;
				data = result;
				error = undefined;
				isLoading = false;
			})
			.catch((cause: unknown) => {
				if (mine !== latest) return;
				error = cause instanceof Error ? cause : new Error(String(cause));
				isLoading = false;
			});
	});

	return {
		get data() {
			return data;
		},
		get error() {
			return error;
		},
		get isLoading() {
			return isLoading;
		}
	};
}

type PaginatedPayload<Row> = { page: Row[]; isDone: boolean; continueCursor: string };

/** Subset of `usePaginatedQuery`'s return that `ConvexInfiniteList` reads. */
export type OneShotPaginatedReturn<Row> = {
	readonly results: Row[];
	readonly status: 'LoadingFirstPage' | 'CanLoadMore' | 'LoadingMore' | 'Exhausted';
	readonly isLoading: boolean;
	readonly error: Error | undefined;
	loadMore: (numItems: number) => void;
};

/**
 * One-shot equivalent of `usePaginatedQuery`: accumulates pages by walking the cursor, without
 * holding a subscription open. Changing `getArgs()` resets the accumulation — a cursor is only
 * meaningful against the access spec that produced it.
 *
 * `initialData` seeds the first page (from a route loader) and is trusted as page one, so no
 * duplicate request is made on mount.
 */
export function convexOneShotPaginatedQuery<Row>(
	query: FunctionReference<'query'>,
	getArgs: () => AnyArgs,
	getOptions: () => { initialNumItems: number; initialData?: PaginatedPayload<Row> }
): OneShotPaginatedReturn<Row> {
	const client = useConvexClient();
	const { initialNumItems, initialData } = getOptions();

	let results = $state<Row[]>(initialData ? [...initialData.page] : []);
	let cursor = $state<string | null>(initialData ? initialData.continueCursor : null);
	let exhausted = $state(initialData ? initialData.isDone : false);
	let isLoading = $state(!initialData);
	let error = $state<Error | undefined>(undefined);

	let latest = 0;
	let lastArgsKey: string | null = null;

	async function fetchPage(from: string | null, numItems: number, replace: boolean) {
		const mine = ++latest;
		isLoading = true;
		try {
			const payload = (await client.query(query, {
				...getArgs(),
				paginationOpts: { numItems, cursor: from }
			})) as PaginatedPayload<Row>;

			if (mine !== latest) return;
			results = replace ? payload.page : [...results, ...payload.page];
			cursor = payload.continueCursor;
			exhausted = payload.isDone;
			error = undefined;
		} catch (cause: unknown) {
			if (mine !== latest) return;
			error = cause instanceof Error ? cause : new Error(String(cause));
		} finally {
			if (mine === latest) isLoading = false;
		}
	}

	$effect(() => {
		const key = JSON.stringify(getArgs());
		if (key === lastArgsKey) return;

		const isFirstRun = lastArgsKey === null;
		lastArgsKey = key;

		// A seeded first page is already the answer for these args — refetching it would show
		// the same rows twice over the wire and flash the list.
		if (isFirstRun && initialData) return;

		results = [];
		cursor = null;
		exhausted = false;
		void fetchPage(null, initialNumItems, true);
	});

	return {
		get results() {
			return results;
		},
		get status() {
			if (isLoading) return results.length === 0 ? 'LoadingFirstPage' : 'LoadingMore';
			return exhausted ? 'Exhausted' : 'CanLoadMore';
		},
		get isLoading() {
			return isLoading;
		},
		get error() {
			return error;
		},
		loadMore(numItems: number) {
			if (isLoading || exhausted) return;
			void fetchPage(cursor, numItems, false);
		}
	};
}
