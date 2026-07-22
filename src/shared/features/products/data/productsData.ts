// TYPES
import type { ProductStatus } from '@/shared/features/products/types/productsTypes';

/** Product status → Spanish label. Insertion order = the order filters/menus list them in. */
export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
	active: 'Activo',
	draft: 'Borrador',
	archived: 'Archivado'
};
