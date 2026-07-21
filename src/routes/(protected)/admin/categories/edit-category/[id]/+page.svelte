<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import EditCategoryHeader from '@/components/pages/(protected)/admin/edit-category/edit-category-header.svelte';
	import EditCategoryForm from '@/components/pages/(protected)/admin/edit-category/edit-category-form.svelte';
	import EditCategoryLoading from '@/components/pages/(protected)/admin/edit-category/loading/edit-category-loading.svelte';
	import EditCategoryEmpty from '@/components/pages/(protected)/admin/edit-category/empty/edit-category-empty.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// `params.id` is `string | undefined` at the type level; `'skip'` the query while missing.
	const categoryId = $derived(page.params.id);

	const categoryQuery = useQuery(
		api.tables.productCategories.queries.fetchCategoryById.fetchCategoryById,
		() => (categoryId ? { categoryId } : 'skip')
	);
	const category = $derived(categoryQuery.data as Doc<'productCategories'> | null | undefined);
</script>

<SvelteHead
	title="Editar categoría"
	noindex
	description="Edita una categoría de la tienda de Vindima."
/>

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<EditCategoryHeader />

	{#if categoryQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar la categoría"
			description="No pudimos cargar esta categoría. Inténtalo de nuevo."
		/>
	{:else if categoryQuery.isLoading}
		<EditCategoryLoading />
	{:else if !category}
		<EditCategoryEmpty />
	{:else}
		{#key category._id}
			<EditCategoryForm {category} />
		{/key}
	{/if}
</section>
