/**
 * Create an upsell rule (UpsellsSystemDesign.md §6.2). One rule per trigger — a second create
 * for the same `triggerKey` returns `RULE_EXISTS` (the UI points the owner at the existing rule
 * instead of a twin). Validates the trigger exists and every offered ref is a live, sellable
 * variant. Inserts `enabled: true`.
 */

// LIBRARIES
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/builders/convexFunctionBuilders';

// CONFIG
import { FEATURES } from '@/shared/config';

// SCHEMAS
import { createUpsellRuleSchema } from '@/shared/features/upsells/schemas/upsellsSchemas';

// HELPERS
import { validateUpsellRule } from '../helpers/validateUpsellRule';

// VALIDATORS
import { mutationResult } from '@/convex/validators/mutationResult';
import type { ConvexMutationResult } from '@/shared/types/types';

export const createUpsellRule = adminMutation({
	args: zodToConvexFields(createUpsellRuleSchema.shape),
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		if (!FEATURES.UPSELLS) {
			return { success: false, message: 'Las sugerencias no están disponibles por el momento.' };
		}

		// Authoritative re-run of the shared schema (shape + item bounds).
		const parsed = createUpsellRuleSchema.safeParse(args);
		if (!parsed.success)
			return {
				success: false,
				message: 'Revisa los artículos sugeridos: algunos ya no están disponibles.'
			};

		const validation = await validateUpsellRule(ctx, parsed.data.trigger, parsed.data.itemRefs);
		if (!validation.ok) return { success: false, message: validation.message };

		// Uniqueness: at most one rule per exact trigger.
		const existing = await ctx.db
			.query('upsells')
			.withIndex('by_trigger_key', (q) => q.eq('triggerKey', validation.triggerKey))
			.unique();
		if (existing) {
			return { success: false, message: 'Ya existe una sugerencia para este disparador.' };
		}

		await ctx.db.insert('upsells', {
			trigger: parsed.data.trigger,
			triggerKey: validation.triggerKey,
			itemRefs: parsed.data.itemRefs,
			enabled: true,
			updatedAt: Date.now()
		});

		return { success: true, message: 'Sugerencia creada.' };
	}
});
