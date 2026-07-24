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
 * Returns RAW fields (`ResolvedCartProduct`): `productName` + `variantLabel`, never a composed
 * display string — the frontend owns display composition (GeneralSystemDesignRule.md § backend
 * returns data; see `variantDisplayName.ts`).
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
			// Unknown ref — never existed. `productName: null`; the frontend renders its own
			// readable fallback for the "no longer available" line; price null.
			results.push({
				productRef: ref,
				productName: null,
				variantLabel: null,
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
		results.push({
			productRef: ref,
			productName: product ? product.name : null,
			variantLabel: variant.label ?? null,
			imageUrl: product ? (product.images[0] ?? null) : null,
			unitPriceMinor: purchasable ? variant.priceMinor : null,
			currency: CART_CONFIG.CURRENCY
		});
	}

	return results;
}
