/**
 * Reward-ledger wire schemas — shared by the Convex mutation (`adminAdjustReward` derives
 * its args via `zodToConvexFields` + authoritative `safeParse`) and the admin Rewards tab,
 * which can pre-validate the same rules.
 */

// LIBRARIES
import { z } from 'zod';

export const adjustRewardSchema = z
	.object({
		userId: z.string().min(1),
		/** Signed whole-number stamp delta. */
		stamps: z.number().int().optional(),
		/** Signed whole-number reward delta. */
		rewards: z.number().int().optional(),
		/** Shown in the customer's activity list — context, never logic. */
		note: z.string().optional()
	})
	// An adjustment must change something.
	.refine((input) => (input.stamps ?? 0) !== 0 || (input.rewards ?? 0) !== 0);

export type AdjustRewardInput = z.infer<typeof adjustRewardSchema>;
