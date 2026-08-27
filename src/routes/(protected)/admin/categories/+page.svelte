<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import AdminCategoriesRow from '@/components/pages/(protected)/admin/categories/admin-categories-row.svelte';
	import AdminCategoriesHeader from '@/components/pages/(protected)/admin/categories/admin-categories-header.svelte';
	import { TableCell, TableHead } from '@/components/ui/table';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	const categories = useConvexPagination(
		api.tables.productCategories.queries.fetchAllCategories.fetchAllCategories,
		() => ({})
	);
</script>

<SvelteHead
	title="Categorías"
	noindex
	description="Administra las categorías de productos que se usan en la tienda y el catálogo de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminCategoriesHeader />

	<DataTable pagination={categories} key={(category) => category._id}>
		{#snippet head()}
			<TableHead>Categoría</TableHead>
		{/snippet}

		{#snippet row(category: Doc<'productCategories'>)}
			<TableCell>
				<AdminCategoriesRow {category} />
			</TableCell>
		{/snippet}

		{#snippet errorSnippet()}
			<p
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
			>
				No se pudieron cargar las categorías.
			</p>
		{/snippet}

		{#snippet empty()}
			<p class="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
				No hay categorías.
			</p>
		{/snippet}
	</DataTable>
</section>
