<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	// CONFIG
	import { SEARCH_DATA } from '@/shared/features/search/config.js';

	// COMPONENTS
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import AdminProductsTableHeader from './admin-products-table-header.svelte';
	import AdminProductsTableItem from './admin-products-table-item.svelte';
	import { TableHead } from '@/components/ui/table';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes.js';
	import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

	// DATA
	import { PRODUCT_STATUS_LABELS } from '@/shared/features/products/data/productsData.js';

	const categoryOptions = useCategoryOptions();
	const filterDefs = [
		{
			key: 'category',
			label: 'Categoría',
			get options() {
				return [{ value: '', label: 'Categoría: todas' }, ...categoryOptions.options];
			}
		},
		{
			key: 'status',
			label: 'Estado',
			options: [
				{ value: '', label: 'Estado: todos' },
				...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({ value, label }))
			]
		}
	] satisfies FilterDef[];
	const filters = useFilters({ defs: filterDefs });
	const search = useSearch({
		minChars: SEARCH_DATA.MIN_QUERY_LENGTH,
		debounceMs: SEARCH_DATA.INPUT_DEBOUNCE_MS
	});

	const products = useConvexPagination(
		api.tables.products.queries.fetchAllProducts.fetchAllProducts,
		() => ({
			search: search.term || undefined,
			filters: filters.isActive ? filters.active : undefined
		}),
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
		<div class="my-4 flex flex-col gap-2 md:flex-row md:items-center">
			<SearchInput
				class="md:mr-auto md:max-w-sm"
				placeholder="Buscar productos..."
				label="Buscar productos"
				bind:value={search.value}
			/>
			{#each filters.defs as filter (filter.key)}
				<select
					class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm md:w-48"
					aria-label={`Filtrar por ${filter.label.toLocaleLowerCase('es')}`}
					value={filters.value(filter.key)}
					onchange={(event) => filters.set(filter.key, event.currentTarget.value)}
				>
					{#each filter.options as option (option.value)}
						<option value={option.value}>{option.label}</option>
					{/each}
				</select>
			{/each}
		</div>
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
		<EmptyData
			title="No hay productos"
			description={search.isActive || filters.isActive
				? 'No hay productos que coincidan con la búsqueda o los filtros.'
				: 'Crea tu primer producto para verlo aquí.'}
		>
			{#snippet icon()}
				<span class="icon-[lucide--package] size-5" aria-hidden="true"></span>
			{/snippet}
		</EmptyData>
	{/snippet}
</DataTable>
