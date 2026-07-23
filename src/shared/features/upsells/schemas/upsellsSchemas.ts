/**
 * Upsells wire schemas — shared by the Convex mutations (args via `zodToConvexFields`, ids
 * overridden with `v.id` at the mutation, `safeParse` re-run authoritatively) and the admin
 * builder form. One schema per feature; no custom error messages here (house convention).
 */

// LIBRARIES
import { z } from 'zod';

// CONFIG
import { UPSELLS_CONFIG } from '@/shared/config';

/** What fires a rule. Mirrors `upsellTriggerValidator` (Convex) and `UpsellTrigger` (type). */
export const upsellTriggerSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('product'), slug: z.string().min(1) }),
	z.object({ kind: z.literal('category'), category: z.string().min(1) }),
	z.object({ kind: z.literal('global') })
]);

/** Wire shape for `createUpsellRule`. Item count is bounded here AND re-checked server-side. */
export const createUpsellRuleSchema = z.object({
	trigger: upsellTriggerSchema,
	itemRefs: z.array(z.string().min(1)).min(1).max(UPSELLS_CONFIG.MAX_ITEMS_PER_RULE)
});

/** Wire shape for `editUpsellRule` — `ruleId` overridden with `v.id('upsells')` at the mutation. */
export const editUpsellRuleSchema = createUpsellRuleSchema.extend({
	ruleId: z.string().min(1)
});

export type UpsellTriggerInput = z.infer<typeof upsellTriggerSchema>;
export type CreateUpsellRuleInput = z.infer<typeof createUpsellRuleSchema>;
export type EditUpsellRuleInput = z.infer<typeof editUpsellRuleSchema>;
