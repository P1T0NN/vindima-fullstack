<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { appGoto } from '@/utils/app-navigation.js';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import VariantFormCard from '@/features/productVariants/components/variant-form-card.svelte';
	import ProductStatusCard from '@/features/products/components/product-status-card.svelte';
	import EditProductAddVariant from './edit-product-add-variant.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/components/ui/card/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';
	import { useFormChanges } from '@/hooks/useFormChanges.svelte.js';

	// FORMS
	import { editProductSections } from '@/shared/features/products/forms/editProductForm';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let { product }: { product: AdminProductRow } = $props();

	const categoryOptions = useCategoryOptions();
	const sections = $derived(editProductSections(categoryOptions.options));

	const formChanges = useFormChanges(() => ({
		productId: product._id,
		name: product.name,
		description: product.description ?? '',
		images: product.images[0] ? [product.images[0]] : undefined,
		category: product.category,
		// Archived products keep their status; archiving and restoring stay outside this form.
		status: product.status === 'archived' ? undefined : product.status,
		featured: product.featured ?? false,
		variants: product.variants.map((variant) => ({
			variantId: variant._id,
			ref: variant.ref,
			label: variant.label ?? '',
			priceMinor: variant.priceMinor,
			available: variant.available,
			sortOrder: variant.sortOrder
		})),
		removedVariantIds: [] as Id<'productVariants'>[]
	}));

	const initialImage = formChanges.values.images?.[0];
	let uploadFiles = $state<PreviewFile[]>(
		initialImage ? [{ id: initialImage, key: initialImage, url: initialImage }] : []
	);

	const archived = $derived(product.status === 'archived');
	const variantIndexes = $derived([...formChanges.values.variants.keys()]);
	const removedVariantIds = $derived(formChanges.values.removedVariantIds);
	const hasChanges = $derived(
		formChanges.isDirty || uploadFiles.some((preview) => Boolean(preview.file))
	);

	let submitting = $state(false);

	function removeVariant(index: number) {
		const variant = formChanges.values.variants[index];
		if (!variant) return;
		if (variant.variantId) formChanges.values.removedVariantIds.push(variant.variantId);
		formChanges.values.variants.splice(index, 1);
	}

	function undoRemovals() {
		const originals = removedVariantIds
			.map((variantId) => {
				const originalIndex = product.variants.findIndex((variant) => variant._id === variantId);
				return { originalIndex, original: product.variants[originalIndex] };
			})
			.filter(({ originalIndex }) => originalIndex >= 0)
			.sort((left, right) => left.originalIndex - right.originalIndex);

		for (const { originalIndex, original } of originals) {
			if (!original) continue;
			formChanges.values.variants.splice(
				Math.min(originalIndex, formChanges.values.variants.length),
				0,
				{
					variantId: original._id,
					ref: original.ref,
					label: original.label ?? '',
					priceMinor: original.priceMinor,
					available: original.available,
					sortOrder: original.sortOrder
				}
			);
		}
		formChanges.values.removedVariantIds = [];
	}
</script>

<Form
	bind:values={formChanges.values}
	fields={sections}
	function={api.tables.products.mutations.editProduct.editProduct}
	uploadNamespace="products"
	prepareArgs={({ values, uploadedFiles }) => ({
		...values,
		productId: values.productId!,
		variants: values.variants!,
		images: uploadedFiles.length > 0 ? uploadedFiles : values.images
	})}
	bind:uploadFiles
	bind:submitting
	resetOnSuccess={false}
	successMessage="Producto actualizado."
	errorMessage="No se pudo actualizar el producto."
	onSuccess={(result) => {
		if (result.success) return appGoto(ADMIN_PAGE_ENDPOINTS.PRODUCTS);
	}}
>
	{#snippet extraFields({ disabled })}
		<Card>
			<CardHeader>
				<CardTitle>Variantes</CardTitle>
				<CardDescription>
					Lo que vendes: al menos una. Las referencias guardadas están bloqueadas; las nuevas deben
					ser únicas.
				</CardDescription>
			</CardHeader>

			<CardContent class="flex flex-col gap-3">
				{#each variantIndexes as i (i)}
					<VariantFormCard
						index={i}
						bind:variant={formChanges.values.variants[i]}
						canRemove={formChanges.values.variants.length > 1}
						onRemove={() => removeVariant(i)}
						refBase={product.slug}
					/>
				{/each}

				{#if removedVariantIds.length > 0}
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<span>
							{removedVariantIds.length === 1
								? '1 variante se eliminará al guardar.'
								: `${removedVariantIds.length} variantes se eliminarán al guardar.`}
						</span>
						<Button type="button" variant="ghost" size="sm" onclick={undoRemovals} {disabled}>
							Deshacer
						</Button>
					</div>
				{/if}

				<EditProductAddVariant bind:variants={formChanges.values.variants} />
			</CardContent>
		</Card>

		<ProductStatusCard bind:status={formChanges.values.status} {archived} />
	{/snippet}

	<Button type="submit" disabled={submitting || !hasChanges}>
		{#if submitting}<Spinner class="size-3.5" />{/if}
		Guardar cambios
	</Button>
</Form>
