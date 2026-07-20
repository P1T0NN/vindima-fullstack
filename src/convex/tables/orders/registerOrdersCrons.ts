// LIBRARIES
import type { Crons } from 'convex/server';

// TYPES
import type { internal } from '../../_generated/api';

type InternalApi = typeof internal;

/**
 * Register the orders crons. `expirePendingOrders` no-ops internally when `FEATURES.CHECKOUT`
 * is off, so leaving it registered is safe regardless of config — no migration to toggle.
 */
export function registerOrdersCrons(crons: Crons, internalApi: InternalApi) {
	/** Cancel abandoned pending orders + free their reward claims. Hourly. */
	crons.hourly(
		'expire pending orders',
		{ minuteUTC: 15 },
		internalApi.tables.orders.crons.ordersCrons.expirePendingOrders,
		{}
	);
}
