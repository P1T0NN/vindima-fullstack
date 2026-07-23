// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';

/** One `/admin/rewards` list row — a reward-eligible variant with its product attached,
 *  as returned by `fetchRewardItems`. `product` is null only if the parent doc vanished
 *  (defensive; the delete gates prevent it). */
export type RewardItemRow = Doc<'productVariants'> & { product: Doc<'products'> | null };

/** Public shop listing — one variant row attached to a category product. Mirrors the
 *  `shopProductVariantRow` Convex validator. */
export type ShopProductVariantRow = {
	_id: Id<'productVariants'>;
	ref: string;
	label: string | null;
	priceMinor: number;
	available: boolean;
	sortOrder: number;
};
