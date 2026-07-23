// Column definitions for the admin products DataTable, kept out of the .svelte component so
// the (long) shape edits on its own. Cell RENDERING (links, badges, buttons) stays in the
// component as snippets — only the data/accessor shape lives here.

// UTILS
import { priceRange } from '@/shared/utils/priceRange';

// TYPES
import type { ColumnDef } from '@/components/ui/data-table/types.js';
import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

/** `nameBySlug` comes from the page's one-shot `fetchCategoryOptions` — rows store the slug. */
export const adminProductsColumns = (
	nameBySlug: Map<string, string>
): ColumnDef<AdminProductRow>[] => [
	{ id: 'name', header: 'Nombre', accessor: (r) => r.name },
	{
		id: 'category',
		header: 'Categoría',
		accessor: (r) => nameBySlug.get(r.category) ?? r.category,
		hideBelow: 'md'
	},
	{ id: 'status', header: 'Estado', accessor: (r) => r.status },
	{ id: 'variants', header: 'Variantes', accessor: (r) => r.variants.length, hideBelow: 'md' },
	{ id: 'price', header: 'Precio', accessor: (r) => priceRange(r.variants), hideBelow: 'sm' },
	{
		id: 'actions',
		header: '',
		// The cell is a button, not data — the accessor exists only to satisfy ColumnDef.
		accessor: () => '',
		headerClass: 'w-px',
		cellClass: 'w-px text-right'
	}
];
