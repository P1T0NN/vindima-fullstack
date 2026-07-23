/**
 * Upsells table — one row = one add-to-cart suggestion rule (UpsellsSystemDesign.md §4.1):
 * "when <trigger> is added to the cart, suggest <itemRefs>". At most one rule per exact
 * trigger, enforced via the denormalized `triggerKey` (Convex can't index into a union).
 *
 * Universal: rules store opaque catalog strings only — product/category slugs as triggers,
 * variant `ref`s as offers — resolved through the same app-layer resolver the cart uses. This
 * module never imports a product schema.
 *
 * Register in `src/convex/schema.ts`. Toggle population via FEATURES.UPSELLS (table always
 * declared so flipping needs no migration).
 */

// LIBRARIES
import { defineTable } from 'convex/server';
import { v } from 'convex/values';

// VALIDATORS
import { upsellTriggerValidator } from '../validators/upsellsValidators';

export const upsellsTable = defineTable({
	/** What fires this rule. Specificity order (most wins): product > category > global. */
	trigger: upsellTriggerValidator,
	/** Denormalized unique key of `trigger` ('product:boards-1' | 'category:tapas' | 'global')
	 *  — Convex can't index into a union, so uniqueness ("one rule per trigger") and O(1) rule
	 *  lookup both ride on this string. Written by the mutations only (see `buildTriggerKey`). */
	triggerKey: v.string(),
	/** Offered items: variant `ref`s, verbatim, in display order. 1..MAX_ITEMS_PER_RULE. Dead
	 *  refs (archived/deleted/unavailable) are filtered at read time, never cascaded. */
	itemRefs: v.array(v.string()),
	/** Off = rule keeps its configuration but never fires. The owner's pause switch. */
	enabled: v.boolean(),
	updatedAt: v.number()
}).index('by_trigger_key', ['triggerKey']);
