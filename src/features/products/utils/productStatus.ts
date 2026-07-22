// The colored badge that wraps this label is still inline at its single render site (the
// admin table) — promote it to a <ProductStatusBadge> when a second one appears.

// DATA
import { PRODUCT_STATUS_LABELS } from '@/shared/features/products/data/productsData';

// TYPES
import type { ProductStatus } from '@/shared/features/products/types/productsTypes';

export function productStatusLabel(status: ProductStatus): string {
	return PRODUCT_STATUS_LABELS[status];
}
