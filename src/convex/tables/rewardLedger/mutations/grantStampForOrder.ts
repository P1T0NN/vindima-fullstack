// LIBRARIES
import { v } from 'convex/values';
import { internalMutation } from '@/convex/_generated/server';

// CONFIG
import { FEATURES } from '@/shared/config.js';

// HELPERS
import { qualifiesForStamp } from '@/shared/features/rewards/utils/rewardsUtils';
import { grantStampCore } from '../helpers/grantStampCore';

// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Order-paid hook. No-op for orders below `MIN_ORDER_MINOR_UNITS`; otherwise grants a
 * pending stamp keyed `order:{orderId}` (idempotent against webhook replays). Pass the
 * subtotal AFTER discounts and EXCLUDING any free reward line (spec §9).
 *
 * Internal (server-only). No-op returning `null` when `FEATURES.REWARDS` is off.
 */
export const grantStampForOrder = internalMutation({
	args: {
		userId: v.string(),
		orderId: v.string(),
		subtotalMinorUnits: v.number()
	},
	handler: async (ctx, args): Promise<Id<'rewardLedger'> | null> => {
		if (!FEATURES.REWARDS) return null;
		if (!qualifiesForStamp(args.subtotalMinorUnits)) return null;
		return grantStampCore(ctx, {
			userId: args.userId,
			source: 'order',
			sourceKey: `order:${args.orderId}`,
			pending: true
		});
	}
});
