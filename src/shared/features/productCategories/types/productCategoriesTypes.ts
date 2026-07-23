// TYPES
import type { Id } from '@/convex/_generated/dataModel';
import type { ShopProductRow } from '@/shared/features/products/types/productsTypes';

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

/**
 * Minimal category projection for the dynamic `/shop/[category]` page header. Just what the
 * storefront header renders — no price bounds (the product grid shows prices) and no id
 * (the slug is the key).
 */
export type ShopCategoryHeader = {
	slug: string;
	name: string;
	subtitle: string | null;
	description: string | null;
	image: string | null;
};

/**
 * Everything the `/shop/[category]` route renders, returned by `fetchCategoryPage` in ONE
 * query: the header plus all active products with variants. Fetched one-shot server-side
 * (SSR — SEO + no client subscription; see docs/GeneralSystemDesignRule.md).
 */
export type ShopCategoryPage = {
	category: ShopCategoryHeader;
	products: ShopProductRow[];
};
