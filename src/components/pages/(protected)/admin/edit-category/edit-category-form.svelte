<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { untrack } from 'svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';

	// SCHEMAS
	import {
		editCategoryFormSchema,
		type EditCategoryFormInput
	} from '@/shared/features/productCategories/schemas/productCategoriesSchemas';

	// FORMS
	import { editCategorySections } from '@/shared/features/productCategories/forms/editCategoryForm';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { category }: { category: Doc<'productCategories'> } = $props();

	// Seeded ONCE from `category` (untracked; the route remounts this via `{#key}` when the
	// edited id changes, so capturing initial values here is correct).
	const seed = untrack(() => category);

	let values = $state<EditCategoryFormInput>({
		name: seed.name,
		description: seed.description ?? '',
		// The current image rides along as a URL string (shown as "imagen existente"), so
		// saving without touching it keeps the category's image as-is.
		image: seed.image ?? null
	});

	// Inject the route's categoryId. A cleared picker sends no `image` at all, which the
	// mutation reads as "keep the current one".
	function transformArgs(args: Record<string, unknown>) {
		const rest = { ...args };
		if (typeof rest.image !== 'string' || !rest.image) delete rest.image;
		return { ...rest, categoryId: category._id };
	}
</script>

<ConvexMutationForm
	bind:values
	schema={editCategoryFormSchema}
	sections={editCategorySections}
	runFunction={api.tables.productCategories.mutations.editCategory.editCategory}
	{transformArgs}
	submitLabel="Guardar cambios"
	resetOnSuccess={false}
	onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.CATEGORIES)}
/>
