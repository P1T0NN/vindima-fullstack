/**
 * Create an upsell rule (UpsellsSystemDesign.md §6.2). One rule per trigger — a second create
 * for the same `triggerKey` returns `RULE_EXISTS` (the UI points the owner at the existing rule
 * instead of a twin). Validates the trigger exists and every offered ref is a live, sellable
 * variant. Inserts `enabled: true`.
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// CONFIG
import { FEATURES } from '@/shared/config';

// SCHEMAS
import { createUpsellRuleSchema } from '@/shared/features/upsells/schemas/upsellsSchemas';

// HELPERS
import { validateUpsellRule } from '../helpers/validateUpsellRule';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const createUpsellRule = adminMutation('createUpsellRule')({
	args: zodToConvexFields(createUpsellRuleSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		if (!FEATURES.UPSELLS) {
			return { success: false, message: { key: 'UpsellsMessages.UPSELLS_DISABLED' } };
		}

		// Authoritative re-run of the shared schema (shape + item bounds).
		const parsed = createUpsellRuleSchema.safeParse(args);
		if (!parsed.success) return { success: false, message: { key: 'UpsellsMessages.INVALID_ITEMS' } };

		const validation = await validateUpsellRule(ctx, parsed.data.trigger, parsed.data.itemRefs);
		if (!validation.ok) return { success: false, message: { key: validation.key } };

		// Uniqueness: at most one rule per exact trigger.
		const existing = await ctx.db
			.query('upsells')
			.withIndex('by_trigger_key', (q) => q.eq('triggerKey', validation.triggerKey))
			.unique();
		if (existing) return { success: false, message: { key: 'UpsellsMessages.RULE_EXISTS' } };

		const ruleId = await ctx.db.insert('upsells', {
			trigger: parsed.data.trigger,
			triggerKey: validation.triggerKey,
			itemRefs: parsed.data.itemRefs,
			enabled: true,
			updatedAt: Date.now()
		});

		ctx.audit(AUDIT_ACTIONS.UPSELL_CREATE, {
			resource: { table: 'upsells', id: ruleId },
			after: { triggerKey: validation.triggerKey, items: parsed.data.itemRefs.length }
		});

		return { success: true, message: { key: 'UpsellsMessages.RULE_CREATED' } };
	}
});
