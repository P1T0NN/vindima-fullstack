// CONFIG
import { FEATURES } from '@/shared/config.js';

// AUTH
import { getAuthUserId } from '@/convex/betterAuth/helpers/getAuthUserId';

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { rewardLedgerFilterAggregate } from '../aggregates/rewardLedgerFilterAggregate.js';
import { rewardLedgerTotalCounter } from '../counters/rewardLedgerTotalCounter.js';

// VALIDATORS
import { myLedgerRowValidator } from '../validators/rewardLedgerValidators.js';

// TYPES
import type { PaginationOptions } from 'convex/server';
import type { ConvexPaginatedPage } from '@/shared/features/pagination/types/paginationTypesConvex.js';

type MyLedgerRow = {
	_id: string;
	_creationTime: number;
	kind: 'stamp' | 'reward-earned' | 'claim' | 'revoke' | 'expire' | 'adjust';
	source: string;
	status: 'pending' | 'confirmed' | 'reversed' | null;
	note: string | null;
};

function emptyPage<T>(paginationOpts: PaginationOptions): ConvexPaginatedPage<T> {
	return {
		items: [],
		nextCursor: null,
		hasNextPage: false,
		pageSize: paginationOpts.numItems
	};
}

/** Public — the signed-in user's own reward history, newest first, paginated. */
export const fetchMyLedger = fetchOptimizedQuery({
	returns: paginatedPageValidator(myLedgerRowValidator),
	count: rewardLedgerFilterAggregate,
	countTotal: async ({ ctx }) => {
		if (!FEATURES.REWARDS) return 0;
		const userId = await getAuthUserId(ctx);
		return userId ? rewardLedgerTotalCounter.count(ctx, userId) : 0;
	},
	fetchPage: async ({ ctx, paginationOpts }): Promise<ConvexPaginatedPage<MyLedgerRow>> => {
		if (!FEATURES.REWARDS) return emptyPage<MyLedgerRow>(paginationOpts);

		const userId = await getAuthUserId(ctx);
		if (!userId) return emptyPage<MyLedgerRow>(paginationOpts);

		const page = await getPagination(
			ctx.db
				.query('rewardLedger')
				.withIndex('by_user', (q) => q.eq('userId', userId))
				.order('desc'),
			{ paginationOpts }
		);

		return {
			...page,
			items: page.items.map((entry) => ({
				_id: entry._id,
				_creationTime: entry._creationTime,
				kind: entry.kind,
				source: entry.source,
				status: entry.status ?? null,
				note: entry.note ?? null
			}))
		};
	}
});
