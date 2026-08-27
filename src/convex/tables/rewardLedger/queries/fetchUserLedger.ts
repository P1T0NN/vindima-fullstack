/**
 * Admin read — one user's full reward ledger, newest first, paginated for the user detail
 * page. Totals stay intentionally omitted until an aggregate is needed.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { getPagination, paginatedPageValidator } from '@/convex/helpers/getPagination.js';
import { fetchOptimizedQuery } from '@/convex/wrappers/fetchOptimizedQuery.js';

// AGGREGATES
import { rewardLedgerFilterAggregate } from '../aggregates/rewardLedgerFilterAggregate.js';
import { rewardLedgerTotalCounter } from '../counters/rewardLedgerTotalCounter.js';

// VALIDATORS
import { rewardLedgerRowValidator } from '../validators/rewardLedgerValidators.js';

export const fetchUserLedger = fetchOptimizedQuery({
	auth: 'admin',
	args: { userId: v.string() },
	returns: paginatedPageValidator(rewardLedgerRowValidator),
	count: rewardLedgerFilterAggregate,
	countTotal: ({ ctx, args }) => rewardLedgerTotalCounter.count(ctx, args.userId),
	fetchPage: ({ ctx, paginationOpts, args }) =>
		getPagination(
			ctx.db
				.query('rewardLedger')
				.withIndex('by_user', (q) => q.eq('userId', args.userId))
				.order('desc'),
			{ paginationOpts }
		)
});
