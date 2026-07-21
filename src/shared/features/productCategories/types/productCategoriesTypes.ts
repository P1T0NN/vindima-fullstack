// TYPES
import type { Id } from '@/convex/_generated/dataModel';

/**
 * One storefront category card, as returned by `fetchCategoriesSafe` — the public
 * projection of a `productCategories` row plus price bounds derived from its active
 * products. Mirrors the `shopCategoryRow` Convex validator.
 */
export type ShopCategoryRow = {
	_id: Id<'productCategories'>;
	slug: string;
	name: string;
	description: string | null;
	image: string | null;
	sortOrder: number;
	/** Active products in this category. */
	productCount: number;
	/** Cheapest / dearest live variant across those products; `null` when there are none. */
	minPriceMinor: number | null;
	maxPriceMinor: number | null;
};
