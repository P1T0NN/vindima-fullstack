/**
 * Delete an upsell rule (UpsellsSystemDesign.md §6.2). Hard delete — rules are pure
 * configuration: no history, nothing references them, nothing to tombstone (contrast variants,
 * which ship in order snapshots).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

export const deleteUpsellRule = adminMutation({
	args: { ruleId: v.id('upsells') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return { success: false, message: 'No encontramos esa sugerencia.' };

		await ctx.db.delete(args.ruleId);

		return { success: true, message: 'Sugerencia eliminada.' };
	}
});
