<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { appGoto } from '@/utils/app-navigation.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// HOOKS
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// FORMS
	import { editCategorySections } from '@/shared/features/productCategories/forms/editCategoryForm';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let { category }: { category: Doc<'productCategories'> } = $props();

	const formChanges = useFormChanges(() => ({
		categoryId: category._id,
		name: category.name,
		subtitle: category.subtitle ?? '',
		description: category.description ?? '',
		// The current image keeps the mutation's image branch active; a new upload takes priority.
		image: category.image ?? undefined
	}));

	const initialImage = formChanges.values.image;
	let uploadFiles = $state<PreviewFile[]>(
		initialImage ? [{ id: initialImage, key: initialImage, url: initialImage }] : []
	);

	const hasChanges = $derived(
		formChanges.isDirty || uploadFiles.some((preview) => Boolean(preview.file))
	);

	let submitting = $state(false);
</script>

<Form
	bind:values={formChanges.values}
	fields={editCategorySections}
	function={api.tables.productCategories.mutations.editCategory.editCategory}
	uploadNamespace="categories"
	prepareArgs={({ values, uploadedFiles }) => ({
		...values,
		categoryId: values.categoryId!,
		name: values.name!,
		image: uploadedFiles[0] ?? values.image
	})}
	bind:uploadFiles
	resetOnSuccess={false}
	bind:submitting
	successMessage="Categoría actualizada."
	errorMessage="No se pudo actualizar la categoría."
	onSuccess={(result) => {
		if (result.success) return appGoto(ADMIN_PAGE_ENDPOINTS.CATEGORIES);
	}}
>
	<Button type="submit" disabled={submitting || !hasChanges}>
		{#if submitting}<Spinner class="size-3.5" />{/if}
		Guardar cambios
	</Button>
</Form>
