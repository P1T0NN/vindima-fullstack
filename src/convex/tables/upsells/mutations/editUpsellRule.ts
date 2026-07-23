/**
 * Edit an upsell rule (UpsellsSystemDesign.md §6.2). Same validation as create; changing the
 * trigger re-runs the uniqueness check against the new `triggerKey`. Full-row replace (rules
 * are small — partial patches buy nothing).
 */

// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// CONFIG
import { FEATURES } from '@/shared/config';

// SCHEMAS
import { editUpsellRuleSchema } from '@/shared/features/upsells/schemas/upsellsSchemas';

// HELPERS
import { validateUpsellRule } from '../helpers/validateUpsellRule';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const editUpsellRule = adminMutation('editUpsellRule')({
	args: {
		...zodToConvexFields(editUpsellRuleSchema.shape),
		ruleId: v.id('upsells')
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		if (!FEATURES.UPSELLS) {
			return { success: false, message: { key: 'UpsellsMessages.UPSELLS_DISABLED' } };
		}

		const parsed = editUpsellRuleSchema.safeParse(args);
		if (!parsed.success) return { success: false, message: { key: 'UpsellsMessages.INVALID_ITEMS' } };

		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return { success: false, message: { key: 'UpsellsMessages.RULE_NOT_FOUND' } };

		const validation = await validateUpsellRule(ctx, parsed.data.trigger, parsed.data.itemRefs);
		if (!validation.ok) return { success: false, message: { key: validation.key } };

		// If the trigger changed, its new key must still be unique (ignore this same row).
		if (validation.triggerKey !== rule.triggerKey) {
			const clash = await ctx.db
				.query('upsells')
				.withIndex('by_trigger_key', (q) => q.eq('triggerKey', validation.triggerKey))
				.unique();
			if (clash) return { success: false, message: { key: 'UpsellsMessages.RULE_EXISTS' } };
		}

		await ctx.db.patch(args.ruleId, {
			trigger: parsed.data.trigger,
			triggerKey: validation.triggerKey,
			itemRefs: parsed.data.itemRefs,
			updatedAt: Date.now()
		});

		ctx.audit(AUDIT_ACTIONS.UPSELL_UPDATE, {
			resource: { table: 'upsells', id: args.ruleId },
			before: { triggerKey: rule.triggerKey, items: rule.itemRefs.length },
			after: { triggerKey: validation.triggerKey, items: parsed.data.itemRefs.length }
		});

		return { success: true, message: { key: 'UpsellsMessages.RULE_UPDATED' } };
	}
});
