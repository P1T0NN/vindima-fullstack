// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/** One `/admin/products` DataTable row — a product with its variants attached, as returned by
 *  `fetchAllProducts` (drafts + archived included). */
export type AdminProductRow = Doc<'products'> & { variants: Doc<'productVariants'>[] };
