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
 * Input validation is the SHARED `editProductSchema` (see `editProductSchemas.ts`) — the
 * same rules the admin form runs pre-submit. `images` is the full desired ordered list
 * (`[0]` = cover; omitted = keep current); status changes stay in `setProductStatus`.
 */

// LIBRARIES
import { v } from 'convex/values';
import { zodToConvexFields } from 'convex-helpers/server/zod4';

// MIDDLEWARE
import { adminMutation } from '@/convex/auth/middleware/authMiddleware';
import { AUDIT_ACTIONS } from '@/convex/tables/auditLog/auditLogConfigs';

// SCHEMAS
import { editProductSchema } from '@/shared/features/products/schemas/editProductSchemas';

// VALIDATORS
import { mutationResult } from '@/convex/helpers/mutationResult';

// UTILS
import { trimToUndefined } from '@/shared/utils/validationUtils';

// HELPERS
import { resolveImageUrls } from '../helpers/resolveImageUrls';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { ConvexMutationResult } from '@/convex/types/convexTypes';

export const editProduct = adminMutation('editProduct')({
	args: {
		// Shape + input rules come from the SHARED schema; the id fields are overridden with
		// real `v.id` validators so the handler keeps typed document ids.
		...zodToConvexFields(editProductSchema.shape),
		productId: v.id('products'),
		removedVariantIds: v.optional(v.array(v.id('productVariants')))
	},
	returns: mutationResult,
	handler: async (ctx, args): Promise<ConvexMutationResult> => {
		// Authoritative run of the shared schema (the form's pre-submit check is advisory).
		// Covers: name non-empty when provided, images ≥ 1 when provided, variants ≥ 1 with
		// unique refs and positive integer prices. DB-dependent gates follow below.
		const parsed = editProductSchema.safeParse(args);
		if (!parsed.success) {
			return { success: false, message: { key: 'GenericMessages.UNEXPECTED_ERROR' } };
		}

		const product = await ctx.db.get(args.productId);
		if (!product) return fail('PRODUCT_NOT_FOUND');

		const name = parsed.data.name; // already trimmed by the schema

		// Runtime category safety (ProductCategorySystemDesign.md §5): a provided slug must exist.
		if (args.category !== undefined) {
			const categoryRow = await ctx.db
				.query('productCategories')
				.withIndex('by_slug', (q) => q.eq('slug', args.category!))
				.unique();
			if (!categoryRow) return fail('CATEGORY_INVALID');
		}

		// One indexed read of this product's variants powers gates 1/4 and payload validation —
		// and lets the write phase below run without a single read, so it can never soft-fail
		// after writes have landed (a returned envelope COMMITS; only throws roll back).
		// Keyed as plain strings so schema-typed variant ids compare without casts.
		const existingAll = await ctx.db
			.query('productVariants')
			.withIndex('by_product', (q) => q.eq('productId', args.productId))
			.collect();
		const existingById = new Map<string, Doc<'productVariants'>>(
			existingAll.map((variant) => [variant._id, variant])
		);

		// ---- Removal gates (DeleteVariantSystemDesign.md §4) — all O(1), validate-first. ----
		// De-duplicate; ids already tombstoned drop out as idempotent no-ops (stale double-save).
		const requestedRemovalIds = [...new Set(args.removedVariantIds ?? [])];
		// Plain string set so schema-typed variant ids (strings) compare without casts.
		const removedSet = new Set<string>(requestedRemovalIds);
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

		// Patch the product's display fields — only what was provided. `images` is the FULL
		// desired ordered list (existing URLs pass through, new refs resolve); `[0]` = cover.
		// An explicit empty list removes all images; omitting the arg keeps them.
		const patch: Record<string, unknown> = {};
		if (name !== undefined) patch.name = name;
		if (args.description !== undefined) patch.description = trimToUndefined(args.description);
		if (args.images !== undefined) {
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
			const label = trimToUndefined(variant.label);
			const sortOrder = variantSortOrder++;
			if (variant.variantId) {
				// Validated above: the id maps to a live variant of this product.
				await ctx.db.patch(existingById.get(variant.variantId)!._id, {
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
