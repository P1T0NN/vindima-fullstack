/**
 * The one resolution implementation (ProductsTableSystemDesign.md §5.1).
 *
 * A plain async helper (not a registered function) shared by the public query
 * (`resolveCartProducts`) and server pricing (`calculateOrderPrice`). For each ref: one indexed
 * point-read on `by_ref`, then a de-duplicated `ctx.db.get` of its product.
 *
 * Resolution rule (§4 invariant): a ref is *purchasable* iff the variant row exists AND
 * `variant.available` AND its product's `status === 'active'`. Anything else — unknown ref,
 * unavailable variant, draft/archived product — resolves with `unitPriceMinor: null`, which
 * every consumer already renders as an "unavailable" line. No consumer branches on *why*.
 *
 * Returns the final display shape (`ResolvedCartProduct`): `name` is `product name · variant label`
 * (single-language plain text — product content is data, not translated UI copy).
 */

// CONFIG
import { CART_CONFIG } from '@/shared/config';

// TYPES
import type { QueryCtx } from '@/convex/_generated/server';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

/** Resolve a batch of refs. Never throws on a bad ref — unknown refs resolve as unavailable. */
export async function resolveRefs(ctx: QueryCtx, refs: string[]): Promise<ResolvedCartProduct[]> {
	const productCache = new Map<Id<'products'>, Doc<'products'> | null>();
	const results: ResolvedCartProduct[] = [];

	for (const ref of refs) {
		const variant = await ctx.db
			.query('productVariants')
			.withIndex('by_ref', (q) => q.eq('ref', ref))
			.unique();

		if (!variant) {
			// Unknown ref — never existed. Readable fallback name for the cart's "no longer
			// available" line; price null.
			results.push({
				productRef: ref,
				name: titleCaseRef(ref),
				imageUrl: null,
				unitPriceMinor: null,
				currency: CART_CONFIG.CURRENCY
			});
			continue;
		}

		let product = productCache.get(variant.productId);
		if (product === undefined) {
			product = await ctx.db.get(variant.productId);
			productCache.set(variant.productId, product);
		}

		// Tombstoned variants (DeleteVariantSystemDesign.md §3) keep their real display name
		// for cart lines but are never purchasable.
		const purchasable =
			product !== null &&
			product.status === 'active' &&
			variant.available &&
			variant.deletedAt === undefined;
		const baseName = product ? product.name : titleCaseRef(ref);
		results.push({
			productRef: ref,
			name: variant.label ? `${baseName} · ${variant.label}` : baseName,
			imageUrl: product ? (product.images[0] ?? null) : null,
			unitPriceMinor: purchasable ? variant.priceMinor : null,
			currency: CART_CONFIG.CURRENCY
		});
	}

	return results;
}

/** 'boards-1-M' → 'Boards 1 M'. Fallback name only, for refs with no product row. */
function titleCaseRef(ref: string): string {
	return ref
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}
