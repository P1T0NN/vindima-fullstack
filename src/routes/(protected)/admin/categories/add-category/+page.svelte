<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AddCategoryHeader from '@/components/pages/(protected)/admin/add-category/add-category-header.svelte';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import {
		createCategoryFormSchema,
		type CreateCategoryFormInput
	} from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

	// FORMS
	import { createCategorySections } from '@/shared/features/productCategories/forms/createCategoryForm';

	// Name, one line of copy, one image — everything else about a category is derived
	// (slug from the name; the storefront price range from the category's products).
	let values = $state<CreateCategoryFormInput>({
		name: '',
		description: '',
		image: null
	});
</script>

<SvelteHead
	title="Nueva categoría"
	noindex
	description="Crea una categoría de la tienda de Vindima."
/>

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<AddCategoryHeader />

	<ConvexMutationForm
		bind:values
		schema={createCategoryFormSchema}
		sections={createCategorySections}
		runFunction={api.tables.productCategories.mutations.createCategory.createCategory}
		submitLabel="Crear categoría"
		resetOnSuccess={false}
		onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.CATEGORIES)}
	/>
</section>
