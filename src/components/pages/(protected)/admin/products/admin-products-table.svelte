<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { productCategoriesClass } from '@/features/products/classes/productCategoriesClass.svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config';
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import PencilIcon from '@lucide/svelte/icons/pencil';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { appHref } from '@/utils/app-navigation.js';

	// TYPES
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

	// Row click opens the dedicated edit page; creating happens on the /add-product route.
	// One helper so the name link and the Editar button can never point at different places.
	function editProductHref(row: AdminProductRow): string {
		return appHref(ADMIN_PAGE_ENDPOINTS.EDIT_PRODUCT.replace(':id', row._id));
	}

	function statusLabel(status: AdminProductRow['status']): string {
		if (status === 'active') return 'Activo';
		if (status === 'archived') return 'Archivado';
		return 'Borrador';
	}

	function priceRange(row: AdminProductRow): string {
		if (row.variants.length === 0) return '—';
		const prices = row.variants.map((v) => v.priceMinor);
		const min = Math.min(...prices);
		const max = Math.max(...prices);
		const fmt = (n: number) => formatMoneyMinor(n, CART_CONFIG.CURRENCY);
		return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
	}

	const columns: ColumnDef<AdminProductRow>[] = [
		{
			id: 'name',
			header: 'Nombre',
			accessor: (r) => r.name
		},
		{
			id: 'category',
			header: 'Categoría',
			// Display name from the shared class; rows store the slug (the stable key).
			accessor: (r) => productCategoriesClass.nameBySlug.get(r.category) ?? r.category,
			hideBelow: 'md'
		},
		{
			id: 'status',
			header: 'Estado',
			accessor: (r) => r.status
		},
		{
			id: 'variants',
			header: 'Variantes',
			accessor: (r) => r.variants.length,
			hideBelow: 'md'
		},
		{
			id: 'price',
			header: 'Precio',
			accessor: (r) => priceRange(r),
			hideBelow: 'sm'
		},
		{
			id: 'actions',
			header: '',
			// The cell is a button, not data — the accessor exists only to satisfy ColumnDef.
			accessor: () => '',
			headerClass: 'w-px',
			cellClass: 'w-px text-right'
		}
	];
</script>

<ConvexDataTable
	caption="Productos"
	query={api.tables.products.queries.fetchAllProducts.fetchAllProducts}
	controlsPlace="top"
	{columns}
	getRowId={(r) => r._id}
	customCells={{ name: nameCell, status: statusCell, actions: actionsCell }}
/>

{#snippet nameCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<a href={editProductHref(row)} class="flex items-center gap-2 hover:underline">
		<span class="size-7 shrink-0 overflow-hidden rounded-md bg-muted">
			{#if row.images[0]}
				<img src={row.images[0]} alt="" class="size-full object-cover" />
			{/if}
		</span>
		<span class="font-medium">{row.name}</span>
	</a>
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<!-- Same destination as the product name — a discoverable target for admins who don't
	     expect the name itself to be a link. -->
	<Button
		variant="outline"
		size="sm"
		href={editProductHref(row)}
		aria-label={`Editar ${row.name}`}
	>
		<PencilIcon class="size-4" />
		Editar
	</Button>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<span
		class={row.status === 'active'
			? 'inline-flex rounded-sm bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-chart-2'
			: row.status === 'archived'
				? 'inline-flex rounded-sm bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'
				: 'inline-flex rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'}
	>
		{statusLabel(row.status)}
	</span>
{/snippet}
