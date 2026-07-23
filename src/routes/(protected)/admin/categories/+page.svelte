<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import AdminCategoriesRow from '@/components/pages/(protected)/admin/categories/admin-categories-row.svelte';
	import AdminCategoriesHeader from '@/components/pages/(protected)/admin/categories/admin-categories-header.svelte';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';

	const columns: ColumnDef<Doc<'productCategories'>>[] = [
		// Single column — the cell carries the whole row UI (name, inline rename, delete).
		{ id: 'name', header: 'Categoría', accessor: (r) => r.name, wrap: true }
	];
</script>

<SvelteHead
	title="Categorías"
	noindex
	description="Administra las categorías de productos que se usan en la tienda y el catálogo de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminCategoriesHeader />

	<!-- The table subscribes to `fetchAllCategories` itself — the page needs no extra query. -->
	<ConvexDataTable
		caption="Categorías"
		query={api.tables.productCategories.queries.fetchAllCategories.fetchAllCategories}
		optimizationStrategy="offset"
		{columns}
		getRowId={(r) => r._id}
		customCells={{ name: nameCell }}
	/>
</section>

{#snippet nameCell({ row }: DataTableCellSnippetProps<Doc<'productCategories'>>)}
	<AdminCategoriesRow category={row} />
{/snippet}
