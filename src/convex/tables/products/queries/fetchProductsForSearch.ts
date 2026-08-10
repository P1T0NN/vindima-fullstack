/**
 * Product name search for admin pickers (upsell trigger, etc.) — dropdown/autocomplete
 * suggestions, active products only. The slim `createSearchQuery` sibling of
 * `fetchAllProducts`: search index only, cursor only, server-capped page, no variants.
 * Callers read it one-shot per keystroke (no subscription). Guide:
 * `pagination/fetchOptimized/README.md § createSearchQuery`.
 */

// LIBRARIES
import { v } from 'convex/values';

// HELPERS
import { createSearchQuery } from '@/convex/pagination/fetchOptimized';

// No advisory rate-limit name: this is an `auth: 'admin'` endpoint (trusted, signed-in
// callers only), so it matches the old paginated picker's un-throttled behavior. Add a
// registered name to `convexRateLimitRegistry` and pass it here if throttling is ever wanted.
export const fetchProductsForSearch = createSearchQuery({
	table: 'products',
	auth: 'admin',
	args: { search: v.string() },
	search: (_ctx, args) => ({
		index: 'search_name',
		searchField: 'name',
		query: args.search,
		eq: { status: 'active' as const }
	})
});
