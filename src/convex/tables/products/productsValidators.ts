/**
 * Shared validators + guards for the products admin mutations (ProductsTableSystemDesign.md §6).
 * Product content is single-language plain text — no localized records.
 */

// LIBRARIES
import { v } from 'convex/values';

/** A single variant's writable fields, shared by create + upsert. */
export const variantInput = v.object({
	ref: v.string(),
	label: v.optional(v.string()),
	priceMinor: v.number(),
	available: v.boolean(),
	sortOrder: v.number()
});

/** Integer minor units, non-negative. */
export function isValidPrice(n: number): boolean {
	return Number.isInteger(n) && n >= 0;
}
