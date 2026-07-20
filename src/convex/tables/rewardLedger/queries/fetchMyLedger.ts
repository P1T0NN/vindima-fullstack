// CONFIG
import { FEATURES } from '@/shared/config.js';

// AUTH
import { getAuthUserId } from '@/convex/auth/helpers/getAuthUserId';

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

/**
 * Public — the signed-in user's own reward history, newest first, paginated. Powers the
 * account-page activity list. `enrich` projects each entry to a display-safe shape (no
 * internal fields beyond id/time); the frontend turns `kind` + `source` into a plain
 * sentence via `rewardsCopy.ts`.
 *
 * `union` with `specs: []` yields a valid empty page (not null) when the rewards feature
 * is off or the caller is signed out, so pagination consumers always get a page.
 */
export const fetchMyLedger = fetchOptimized({
	table: 'rewardLedger',
	union: async (ctx) => {
		if (!FEATURES.REWARDS) return { specs: [] };
		const userId = await getAuthUserId(ctx);
		return { specs: userId ? [{ index: 'by_user' as const, eq: { userId } }] : [] };
	},
	enrich: (_ctx, page) =>
		page.map((entry) => ({
			_id: entry._id,
			_creationTime: entry._creationTime,
			kind: entry.kind,
			source: entry.source,
			status: entry.status ?? null,
			note: entry.note ?? null
		}))
});
