/**
 * Admin order list — every order, newest first, paginated (cursor mode) for the
 * `/admin/orders` DataTable. Raw `Doc<'orders'>` rows; display mapping (status collapse,
 * money formatting) happens client-side, same as the customer list.
 */

// HELPERS
import { fetchOptimized } from '@/convex/helpers/fetchOptimized';

export const fetchOrders = fetchOptimized({
	table: 'orders',
	auth: 'admin'
});
