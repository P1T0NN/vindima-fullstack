<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// TABLE / DATA / UTILS
	import { adminProductsColumns } from '@/features/products/tables/adminProductsTable.js';
	import { PRODUCT_STATUS_LABELS } from '@/shared/features/products/data/productsData.js';
	import { productStatusLabel } from '@/features/products/utils/productStatus.js';
	import { appHref } from '@/utils/app-navigation.js';

	// TYPES
	import type { DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

	// LUCIDE ICONS
	import PencilIcon from '@lucide/svelte/icons/pencil';

	// Categories feed the filter select and the slug→name column.
	const categoryOptions = useCategoryOptions();

	// Filters: '' = all. Both flow into the query via `queryArgs` (undefined when all).
	let statusFilter = $state<'' | AdminProductRow['status']>('');
	let categoryFilter = $state<string>('');

	const statusFilterOptions = [
		{ value: '', label: 'Estado: todos' },
		...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
	];
	const categoryFilterOptions = $derived([
		{ value: '', label: 'Categoría: todas' },
		...categoryOptions.options
	]);

	function editProductHref(row: AdminProductRow): string {
		return appHref(ADMIN_PAGE_ENDPOINTS.EDIT_PRODUCT.replace(':id', row._id));
	}
</script>

<ConvexDataTable
	caption="Productos"
	query={api.tables.products.queries.fetchAllProducts.fetchAllProducts}
	queryArgs={{ status: statusFilter || undefined, category: categoryFilter || undefined }}
	controlsPlace="top"
	searchable
	searchPlaceholder="Buscar por nombre…"
	columns={adminProductsColumns(categoryOptions.nameBySlug)}
	getRowId={(r) => r._id}
	customCells={{ name: nameCell, status: statusCell, actions: actionsCell }}
	{filters}
/>

{#snippet filters()}
	<NativeSelect
		class="w-full md:w-40"
		ariaLabel="Filtrar por estado"
		bind:value={() => statusFilter, (v) => (statusFilter = v as typeof statusFilter)}
		options={statusFilterOptions}
	/>

	<NativeSelect
		class="w-full md:w-48"
		ariaLabel="Filtrar por categoría"
		bind:value={() => categoryFilter, (v) => (categoryFilter = v ?? '')}
		options={categoryFilterOptions}
	/>
{/snippet}

{#snippet nameCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<a href={editProductHref(row)} class="flex items-center gap-2 hover:underline">
		<span class="size-7 shrink-0 overflow-hidden rounded-md bg-muted">
			{#if row.images[0]}
				<img
					src={row.images[0]}
					alt=""
					class="size-full object-cover"
					loading="lazy"
					decoding="async"
				/>
			{/if}
		</span>
		<span class="font-medium">{row.name}</span>
	</a>
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<!-- Same destination as the product name — a discoverable target for admins who don't
	     expect the name itself to be a link. -->
	<Button variant="outline" size="sm" href={editProductHref(row)} aria-label={`Editar ${row.name}`}>
		<PencilIcon class="size-4" />
		Editar
	</Button>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<AdminProductRow>)}
	<span
		class={row.status === 'active'
			? 'inline-flex rounded-sm bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-gold-ink'
			: row.status === 'archived'
				? 'inline-flex rounded-sm bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'
				: 'inline-flex rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'}
	>
		{productStatusLabel(row.status)}
	</span>
{/snippet}
