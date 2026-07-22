// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** One `/admin/products` DataTable row — a product with its variants attached, as returned by
 *  `fetchAllProducts` (drafts + archived included). */
export type AdminProductRow = Doc<'products'> & { variants: Doc<'productVariants'>[] };

/** Publication state stored on a product row (`draft` | `active` | `archived`). */
export type ProductStatus = Doc<'products'>['status'];

/** The publication states the product forms can set. `archived` is deliberately absent —
 *  archiving/restoring is its own action (`setProductStatus`), not a form field. */
export type ProductFormStatus = 'draft' | 'active';
