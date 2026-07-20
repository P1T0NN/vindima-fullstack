// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/** One priced order line as `calculateOrderPrice` snapshots it (name + unit price frozen at placement). */
export type PricedLine = {
	productRef: string;
	name: string;
	qty: number;
	unitPriceMinor: number;
	isRewardLine?: boolean;
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
