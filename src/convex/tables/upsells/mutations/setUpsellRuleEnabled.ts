/**
 * Toggle an upsell rule on/off (UpsellsSystemDesign.md §6.2) — the list's one-tap pause switch.
 * No item re-validation: a paused rule may keep dead refs; they're only re-checked on the next
 * full edit. Mirrors `setProductStatus`.
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const setUpsellRuleEnabled = adminMutation('setUpsellRuleEnabled')({
	args: { ruleId: v.id('upsells'), enabled: v.boolean() },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return { success: false, message: { key: 'UpsellsMessages.RULE_NOT_FOUND' } };

		await ctx.db.patch(args.ruleId, { enabled: args.enabled, updatedAt: Date.now() });

		ctx.audit(AUDIT_ACTIONS.UPSELL_TOGGLE, {
			resource: { table: 'upsells', id: args.ruleId },
			before: { enabled: rule.enabled },
			after: { enabled: args.enabled }
		});

		return { success: true, message: { key: 'UpsellsMessages.RULE_TOGGLED' } };
	}
});
