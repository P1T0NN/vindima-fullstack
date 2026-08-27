<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	// COMPONENTS
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import AdminProductsTableHeader from './admin-products-table-header.svelte';
	import AdminProductsTableItem from './admin-products-table-item.svelte';
	import { TableHead } from '@/components/ui/table';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes.js';

	const categoryOptions = useCategoryOptions();

	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProducts.fetchAllProducts,
		() => ({}),
		{ pageSize: 10 }
	);

	const total = $derived(products.total ?? null);
</script>

<DataTable
	pagination={products}
	{total}
	placement="above"
	class="text-sm"
	key={(product) => product._id}
>
	{#snippet header()}
		<AdminProductsTableHeader />
	{/snippet}

	{#snippet head()}
		<TableHead>Nombre</TableHead>
		<TableHead class="hidden md:table-cell">Categoría</TableHead>
		<TableHead>Estado</TableHead>
		<TableHead class="hidden text-right md:table-cell">Variantes</TableHead>
		<TableHead class="hidden text-right sm:table-cell">Precio</TableHead>
		<TableHead class="w-px text-right">Acciones</TableHead>
	{/snippet}

	{#snippet row(product: AdminProductRow)}
		<AdminProductsTableItem {product} categoryNames={categoryOptions.nameBySlug} />
	{/snippet}

	{#snippet errorSnippet()}
		<p
			class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			No se pudieron cargar los productos.
		</p>
	{/snippet}

	{#snippet empty()}
		<EmptyData title="No hay productos" description="Crea tu primer producto para verlo aquí.">
			{#snippet icon()}
				<span class="icon-[lucide--package] size-5" aria-hidden="true"></span>
			{/snippet}
		</EmptyData>
	{/snippet}
</DataTable>
