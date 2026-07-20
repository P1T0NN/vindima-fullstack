/**
 * Admin catalog list (ProductsTableSystemDesign.md §6) — paginated full catalog (drafts +
 * archived included), variants attached, for the `/admin/products` DataTable. Cursor mode,
 * newest first.
 */

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';
import { attachVariants } from '../helpers/attachVariants';

export const fetchAllProducts = fetchOptimized({
	table: 'products',
	auth: 'admin',
	enrich: (ctx, page) => attachVariants(ctx, page)
});
