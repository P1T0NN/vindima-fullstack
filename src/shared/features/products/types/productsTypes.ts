// TYPES
import type { Doc, Id } from '@/convex/_generated/dataModel';
import type { ShopProductVariantRow } from '@/shared/features/productVariants/types/productVariantsTypes';

/** One `/admin/products` DataTable row — a product with its variants attached, as returned by
 *  `fetchAllProducts` (drafts + archived included). */
export type AdminProductRow = Doc<'products'> & { variants: Doc<'productVariants'>[] };

/** Public shop listing — an active product with its live variants, as returned inside
 *  `fetchCategoryPage`. Mirrors the `shopProductRow` Convex validator. */
export type ShopProductRow = {
	_id: Id<'products'>;
	slug: string;
	name: string;
	description: string | null;
	/** `images[0]` is the cover. */
	images: string[];
	category: string;
	featured: boolean;
	sortOrder: number;
	variants: ShopProductVariantRow[];
};

/** Publication state stored on a product row (`draft` | `active` | `archived`). */
export type ProductStatus = Doc<'products'>['status'];

/** The publication states the product forms can set. `archived` is deliberately absent —
 *  archiving/restoring is its own action (`setProductStatus`), not a form field. */
export type ProductFormStatus = 'draft' | 'active';
