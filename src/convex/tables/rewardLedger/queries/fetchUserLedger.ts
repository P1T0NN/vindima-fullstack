/**
 * Admin read — one user's full reward ledger, newest first, paginated (cursor mode) for
 * the /admin/users/[id] Rewards tab DataTable. Raw entries; the admin sees exactly what
 * the system recorded (including reversed stamps and manual adjustments).
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

export const fetchUserLedger = fetchOptimized({
	table: 'rewardLedger',
	auth: 'admin',
	args: { userId: v.string() },
	where: (_ctx, args) => ({ index: 'by_user', eq: { userId: args.userId } })
});
