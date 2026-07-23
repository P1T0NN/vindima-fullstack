// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/** Money-lifecycle status stored on an order row (`pending | paid | cancelled | refunded`). */
export type OrderStatus = Doc<'orders'>['status'];

/** One priced order line as `calculateOrderPrice` snapshots it (name + unit price frozen at placement). */
export type PricedLine = {
	productRef: string;
	name: string;
	qty: number;
	unitPriceMinor: number;
	isRewardLine?: boolean;
};

/** Admin dashboard period presets (`AdminDashboardPageSystemDesign.md` §7.2). */
export type DashboardPeriod = 'today' | '7d' | '30d' | '90d';

/** One window's headline numbers (current vs previous — deltas derive client-side). */
export type DashboardKpis = {
	/** Net: settled totals minus refunded totals, both by event time (hourly rollups). */
	revenueMinor: number;
	ordersCount: number;
	refundsMinor: number;
	/** First purchases recorded in the window (buyers, not signups). */
	newCustomers: number;
};

/** Everything `/admin/dashboard` renders, from ONE `fetchDashboard` call. */
export type DashboardPayload = {
	ordersCounts: { pendingCount: number; toFulfillCount: number };
	kpis: { current: DashboardKpis; previous: DashboardKpis };
	/** Store-local day buckets (hour buckets when period = today), oldest first, gaps zero-filled. */
	revenueSeries: { t: number; valueMinor: number }[];
	/** Top 5 by revenue in the current window (analytics `productRevenue` breakdown). */
	topProducts: { name: string; revenueMinor: number }[];
	categoryRevenue: { name: string; revenueMinor: number }[];
	currency: string;
};

/** `calculateOrderPrice`'s verdict — either every line priced, or the refs that failed placement. */
export type PriceResult =
	| { ok: false; unavailableRefs: string[] }
	| {
			ok: true;
			lines: PricedLine[];
			amounts: {
				subtotalMinor: number;
				welcomeDiscountMinor: number;
				shippingMinor: number;
				totalMinor: number;
			};
			currency: string;
			claimId?: Id<'rewardClaims'>;
	  };
