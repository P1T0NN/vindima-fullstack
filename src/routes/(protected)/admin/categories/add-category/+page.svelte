<script lang="ts">
	// SVELTEKIT

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';
	import { appGoto } from '@/utils/app-navigation.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AddCategoryHeader from '@/components/pages/(protected)/admin/add-category/add-category-header.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// TYPES
	import type { CreateCategoryInput } from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

	// FORMS
	import { createCategorySections } from '@/shared/features/productCategories/forms/createCategoryForm';

	// Name, one line of copy, one image — everything else about a category is derived
	// (slug from the name; the storefront price range from the category's products).
	let values = $state<CreateCategoryInput>({
		name: '',
		subtitle: '',
		description: '',
		image: ''
	});

	let submitting = $state(false);
</script>

<SvelteHead
	title="Nueva categoría"
	noindex
	description="Crea una categoría de la tienda de Vindima."
/>

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<AddCategoryHeader />

	<Form
		bind:values
		fields={createCategorySections}
		function={api.tables.productCategories.mutations.createCategory.createCategory}
		uploadNamespace="categories"
		prepareArgs={({ values, uploadedFiles }) => ({
			...values,
			name: values.name!,
			image: uploadedFiles[0] ?? values.image!
		})}
		resetOnSuccess={false}
		bind:submitting
		successMessage="Categoría creada."
		errorMessage="No se pudo crear la categoría."
		onSuccess={(result) => {
			if (result.success) return appGoto(ADMIN_PAGE_ENDPOINTS.CATEGORIES);
		}}
	>
		<Button type="submit" disabled={submitting}>
			{#if submitting}<Spinner class="size-3.5" />{/if}
			Crear categoría
		</Button>
	</Form>
</section>
