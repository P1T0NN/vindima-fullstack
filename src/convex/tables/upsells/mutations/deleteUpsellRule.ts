/**
 * Delete an upsell rule (UpsellsSystemDesign.md §6.2). Hard delete — rules are pure
 * configuration: no history, nothing references them, nothing to tombstone (contrast variants,
 * which ship in order snapshots).
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const deleteUpsellRule = adminMutation('deleteUpsellRule')({
	args: { ruleId: v.id('upsells') },
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const rule = await ctx.db.get(args.ruleId);
		if (!rule) return { success: false, message: { key: 'UpsellsMessages.RULE_NOT_FOUND' } };

		await ctx.db.delete(args.ruleId);

		ctx.audit(AUDIT_ACTIONS.UPSELL_DELETE, {
			resource: { table: 'upsells', id: args.ruleId },
			before: { triggerKey: rule.triggerKey, items: rule.itemRefs.length }
		});

		return { success: true, message: { key: 'UpsellsMessages.RULE_DELETED' } };
	}
});
