<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { productCategoriesClass } from '@/features/products/classes/productCategoriesClass.svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import CategoriesAddForm from '@/components/pages/(protected)/admin/categories/categories-add-form.svelte';
	import CategoriesRow from '@/components/pages/(protected)/admin/categories/categories-row.svelte';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';

	const columns: ColumnDef<Doc<'productCategories'>>[] = [
		// Single column — the cell carries the whole row UI (name, inline rename, delete).
		{ id: 'name', header: 'Category', accessor: (r) => r.name, wrap: true }
	];
</script>

<SvelteHead title="Categories" />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Categories</h1>
		<p class="text-sm text-muted-foreground">
			The groups products belong to — shop pages and product forms use these.
		</p>
	</header>

	<CategoriesAddForm />

	{#if productCategoriesClass.error}
		<ErrorComponent
			variant="alert"
			title="Failed to load categories"
			description="Something went wrong while fetching categories. Please try again."
		/>
	{:else}
		<ConvexDataTable
			caption="Categories"
			query={api.tables.products.queries.fetchAllCategories.fetchAllCategories}
			optimizationStrategy="offset"
			{columns}
			getRowId={(r) => r._id}
			customCells={{ name: nameCell }}
		/>
	{/if}
</section>

{#snippet nameCell({ row }: DataTableCellSnippetProps<Doc<'productCategories'>>)}
	<CategoriesRow category={row} />
{/snippet}
