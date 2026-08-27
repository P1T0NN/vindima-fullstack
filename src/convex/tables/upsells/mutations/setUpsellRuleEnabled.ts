/**
 * Toggle an upsell rule on/off (UpsellsSystemDesign.md §6.2) — the list's one-tap pause switch.
 * No item re-validation: a paused rule may keep dead refs; they're only re-checked on the next
 * full edit. Mirrors `setProductStatus`.
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

export const setUpsellRuleEnabled = adminMutation({
	args: { ruleId: v.id('upsells'), enabled: v.boolean() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return { success: false, message: 'No encontramos esa sugerencia.' };

		await ctx.db.patch(args.ruleId, { enabled: args.enabled, updatedAt: Date.now() });

		return { success: true, message: 'Sugerencia actualizada.' };
	}
});
