/**
 * Edit a product + reconcile its variants in one transaction — the edit counterpart to
 * `createProduct`, submitted by the admin edit form via `ConvexMutationForm` (one call).
 *
 * Product display fields are patched (slug is immutable, so it isn't an arg). Variants are upserted:
 * an entry with `variantId` patches an existing variant (**`ref` stays immutable** — a shipped ref
 * is a public contract), an entry without one inserts a new variant (`ref` must be globally unique).
 * Variants absent from the payload are left untouched — removal is EXPLICIT via `removedVariantIds`
 * (DeleteVariantSystemDesign.md §3: deletion-by-omission would let a stale client nuke rows).
 *
 * Removal is two-regime (DeleteVariantSystemDesign.md §3, keyed off the product's `wasActive`
 * latch): never-activated product → hard delete (ref never shipped, freeing it is safe);
 * ever-activated → tombstone (`deletedAt`) so the ref stays reserved forever (no silent reuse into
 * guest carts) and cart lines keep their real display name. Gates (§4) are all O(1) and run before
 * any write — any refusal aborts the whole save atomically. There is deliberately NO order/cart
 * gate: orders snapshot their lines at placement (§2).
 *
 * Images are only overwritten when new ones are uploaded (empty array = keep current); status
 * changes stay in `setProductStatus`.
 */

// LIBRARIES
import { v } from 'convex/values';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// VALIDATORS
import { isValidPrice } from '../productsValidators';
import { mutationResult } from '@/convex/helpers/mutationResult';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

// HELPERS
import { resolveImageUrls } from '../helpers/resolveImageUrls';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** Trim; empty → undefined. Lets the admin form pass raw values straight through. */
const clean = (s: string | undefined | null): string | undefined => {
	const t = s?.trim();
	return t ? t : undefined;
};

/** A variant row from the edit form — like `variantInput` plus an optional id (present = patch). */
const editVariantInput = v.object({
	variantId: v.optional(v.id('productVariants')),
	ref: v.string(),
	label: v.optional(v.string()),
	priceMinor: v.number(),
	available: v.boolean(),
	sortOrder: v.number()
});

export const editProduct = adminMutation('editProduct')({
	args: {
		productId: v.id('products'),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		/** Uploaded-file references or direct paths/URLs. `[0]` = cover. Empty/omitted = keep current. */
		images: v.optional(v.array(v.string())),
		category: v.optional(v.string()),
		featured: v.optional(v.boolean()),
		sortOrder: v.optional(v.number()),
		variants: v.array(editVariantInput),
		/** Saved variants to remove — explicit intent, never inferred from payload absence. */
		removedVariantIds: v.optional(v.array(v.id('productVariants')))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		const product = await ctx.db.get(args.productId);
		if (!product) return fail('PRODUCT_NOT_FOUND');

		// Validate first — nothing written yet, so every failure is a clean soft error.
		const name = args.name !== undefined ? clean(args.name) : undefined;
		if (args.name !== undefined && !name) return fail('NAME_REQUIRED');
		if (args.variants.length === 0) return fail('VARIANT_REQUIRED');

		// Runtime category safety (ProductCategorySystemDesign.md §5): a provided slug must exist.
		if (args.category !== undefined) {
			const categoryRow = await ctx.db
				.query('productCategories')
				.withIndex('by_slug', (q) => q.eq('slug', args.category!))
				.unique();
			if (!categoryRow) return fail('CATEGORY_INVALID');
		}

		const seen = new Set<string>();
		for (const variant of args.variants) {
			if (!isValidPrice(variant.priceMinor)) return fail('INVALID_PRICE');
			if (seen.has(variant.ref)) return fail('REF_TAKEN');
			seen.add(variant.ref);
		}

		// One indexed read of this product's variants powers gates 1/4 and payload validation —
		// and lets the write phase below run without a single read, so it can never soft-fail
		// after writes have landed (a returned envelope COMMITS; only throws roll back).
		const existingAll = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', args.productId))
			.collect();
		const existingById = new Map(existingAll.map((variant) => [variant._id, variant]));

		// ---- Removal gates (DeleteVariantSystemDesign.md §4) — all O(1), validate-first. ----
		// De-duplicate; ids already tombstoned drop out as idempotent no-ops (stale double-save).
		const requestedRemovalIds = [...new Set(args.removedVariantIds ?? [])];
		const removedSet = new Set(requestedRemovalIds);
		const removals: Doc<'productVariants'>[] = [];
		for (const variantId of requestedRemovalIds) {
			// Gate 1 — exists and belongs to this product (absent from this product's variant
			// list covers both "missing" and "another product's id").
			const existing = existingById.get(variantId);
			if (!existing) return fail('VARIANT_NOT_FOUND');
			if (existing.deletedAt !== undefined) {
				removedSet.delete(variantId); // already gone — no-op
				continue;
			}
			// Gate 2 — a reward item can gain new claims at any moment; the owner removes it
			// from /admin/rewards first (RewardItemsSystemDesign.md §4.7).
			if (existing.rewardEligible === true) {
				return fail('VARIANT_REWARD_ELIGIBLE');
			}
			// Gate 3 — an active claim holds the customer's reserved free item (stale-config case).
			const activeClaim = await ctx.db
				.query('rewardClaims')
				.withIndex('by_item_status', (q) => q.eq('itemRef', existing.ref).eq('status', 'active'))
				.first();
			if (activeClaim) return fail('VARIANT_HAS_ACTIVE_CLAIM');

			removals.push(existing);
		}

		// Gate 4 — a product always keeps ≥ 1 live variant (existence, not availability).
		const existingLive = existingAll.filter((variant) => variant.deletedAt === undefined);
		const newRows = args.variants.filter((variant) => !variant.variantId);
		const liveAfter =
			existingLive.filter((variant) => !removedSet.has(variant._id)).length + newRows.length;
		if (liveAfter < 1) return fail('LAST_VARIANT');

		// Kept payload variants must be valid BEFORE any write. Tombstoned rows (another admin
		// removed them mid-edit) are skipped silently (§8 A5) — the row is gone from every UI;
		// failing the whole save over it would punish unrelated edits.
		const skipVariantIds = new Set<string>();
		for (const variant of args.variants) {
			if (!variant.variantId || removedSet.has(variant.variantId)) continue;
			const existing = existingById.get(variant.variantId);
			if (!existing) return fail('VARIANT_NOT_FOUND');
			if (existing.deletedAt !== undefined) skipVariantIds.add(variant.variantId);
		}

		// New variants must not collide with a ref already used anywhere — EXCEPT a row being
		// hard-deleted in this same save (never-shipped ref, regime A). A tombstoned or
		// to-be-tombstoned row keeps its ref reserved (regime B → REF_TAKEN).
		for (const variant of newRows) {
			const refTaken = await ctx.db
				.query('productVariants')
				.withIndex('by_ref', (q) => q.eq('ref', variant.ref))
				.unique();
			if (refTaken && !(removedSet.has(refTaken._id) && !product.wasActive)) {
				return fail('REF_TAKEN');
			}
		}

		// ---- All gates passed — write. ----

		// Patch the product's display fields — only what was provided; images only when re-uploaded.
		const patch: Record<string, unknown> = {};
		if (name !== undefined) patch.name = name;
		if (args.description !== undefined) patch.description = clean(args.description);
		if (args.images !== undefined && args.images.length > 0) {
			patch.images = await resolveImageUrls(ctx, args.images);
		}
		if (args.category !== undefined) patch.category = args.category;
		if (args.featured !== undefined) patch.featured = args.featured;
		// Product ordering isn't edited here — it's auto-assigned on create; `args.sortOrder` is ignored.
		await ctx.db.patch(args.productId, patch);

		// Removals before upserts, so a regime-A hard delete frees its ref for same-save re-insert.
		const mode = product.wasActive ? 'tombstone' : 'hard';
		for (const removal of removals) {
			if (mode === 'tombstone') {
				await ctx.db.patch(removal._id, { deletedAt: Date.now() });
			} else {
				await ctx.db.delete(removal._id);
			}
			ctx.audit(AUDIT_ACTIONS.VARIANT_DELETE, {
				resource: { table: 'productVariants', id: removal._id },
				before: { ref: removal.ref, priceMinor: removal.priceMinor },
				after: { mode }
			});
		}

		// Upsert variants: patch existing (ref immutable), insert new. Order = the order the admin
		// listed them in the form (top to bottom), so `sortOrder` is the row index, not typed input.
		// Fully validated above — this loop only writes, so it can never partially commit.
		let variantSortOrder = 0;
		for (const variant of args.variants) {
			// Removal wins over edit; tombstoned rows skip silently (§8 A5, validated above).
			if (variant.variantId && (removedSet.has(variant.variantId) || skipVariantIds.has(variant.variantId)))
				continue;
			const label = clean(variant.label);
			const sortOrder = variantSortOrder++;
			if (variant.variantId) {
				await ctx.db.patch(variant.variantId, {
					label,
					priceMinor: variant.priceMinor,
					available: variant.available,
					sortOrder
				});
			} else {
				await ctx.db.insert('productVariants', {
					productId: args.productId,
					ref: variant.ref,
					label,
					priceMinor: variant.priceMinor,
					available: variant.available,
					sortOrder
				});
			}
		}

		ctx.audit(AUDIT_ACTIONS.PRODUCT_UPDATE, {
			resource: { table: 'products', id: args.productId },
			before: { slug: product.slug, category: product.category },
			after: {
				category: args.category ?? product.category,
				variantCount: args.variants.length,
				removedVariants: removals.length
			}
		});

		return { success: true, message: { key: 'ProductMessages.PRODUCT_UPDATED' } };
	}
});

function fail(key: string): ConvexMutationResult {
	return { success: false, message: { key: `ProductMessages.${key}` } };
}
