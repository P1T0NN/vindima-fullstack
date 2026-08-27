<script lang="ts">
	// SVELTEKIT

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AddProductHeader from '@/components/pages/(protected)/admin/add-product/add-product-header.svelte';
	import VariantFormCard from '@/features/productVariants/components/variant-form-card.svelte';
	import ProductStatusCard from '@/features/products/components/product-status-card.svelte';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/components/ui/card/index.js';

	// SCHEMAS
	import {
		createProductFormSchema,
		createProductSchema,
		type CreateProductInput,
		type CreateProductWireInput
	} from '@/shared/features/products/schemas/productsSchemas';

	// FORMS
	import { createProductSections } from '@/shared/features/products/forms/createProductForm';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	import {
		zodIssuesForArrayItemErrors,
		zodIssuesToFieldErrors
	} from '@/shared/features/validations/utils/zodFieldErrors';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	type ProductFormValues = Omit<CreateProductInput, 'images'> & {
		images: CreateProductWireInput['images'];
	};

	// Category options come from the DB — the owner picks, never types (typo-proof).
	const categoryOptions = useCategoryOptions();
	const sections = $derived(createProductSections(categoryOptions.options));

	let values = $state<ProductFormValues>({
		name: '',
		description: '',
		images: [],
		category: '',
		// Publish by default — the common case is adding a product that goes live.
		status: 'active',
		featured: false,
		variants: [{ ref: '', label: '', priceMinor: 0, available: true, sortOrder: 0 }]
	});
	let uploadFiles = $state<PreviewFile[]>([]);
	let validationSubmitted = $state(false);
	let submitting = $state(false);

	const variantIndexes = $derived([...values.variants.keys()]);

	function addVariant() {
		values.variants.push({
			ref: '',
			label: '',
			priceMinor: 0,
			available: true,
			sortOrder: values.variants.length
		});
	}

	function removeVariant(index: number) {
		values.variants.splice(index, 1);
	}

	const validationIssues = $derived.by(() => {
		if (!validationSubmitted) return [];
		const validation = createProductFormSchema.safeParse({
			...values,
			images: uploadFiles[0]?.file ?? null
		});
		return validation.success ? [] : validation.error.issues;
	});

	const validationErrors = $derived(zodIssuesToFieldErrors(validationIssues));
</script>

<SvelteHead
	title="Nuevo producto"
	noindex
	description="Crea un nuevo producto en el catálogo de Vindima."
/>

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<AddProductHeader />

	<Form
		bind:values
		fields={sections}
		function={api.tables.products.mutations.createProduct.createProduct}
		uploadNamespace="products"
		bind:uploadFiles
		bind:submitting
		prepareArgs={({ values: formValues, uploadedFiles }) => {
			validationSubmitted = true;
			const preparedValues = {
				...formValues,
				name: formValues.name!,
				category: formValues.category!,
				variants: formValues.variants!,
				images: uploadedFiles
			};
			const validation = createProductSchema.safeParse(preparedValues);
			if (!validation.success) throw new Error('Corrige los errores del formulario.');
			return validation.data;
		}}
		resetOnSuccess={false}
		successMessage="Producto creado."
		errorMessage="No se pudo crear el producto."
		onSuccess={(result) => {
			if (result.success) return appGoto(ADMIN_PAGE_ENDPOINTS.PRODUCTS);
		}}
		{extraFields}
	>
		<Button type="submit" disabled={submitting}>
			{#if submitting}<Spinner class="size-3.5" />{/if}
			Crear producto
		</Button>
	</Form>
</section>

{#snippet extraFields({ disabled }: { disabled: boolean })}
	<!-- Variants — an array editor, so it can't be a declared section; styled as one. -->
	<Card>
		<CardHeader>
			<CardTitle>Variantes</CardTitle>
			<CardDescription>
				Lo que vendes: al menos una. La referencia es permanente una vez creada.
			</CardDescription>
		</CardHeader>

		<CardContent class="flex flex-col gap-3">
			{#each variantIndexes as i (i)}
				<VariantFormCard
					index={i}
					bind:variant={values.variants[i]}
					canRemove={values.variants.length > 1 && !disabled}
					onRemove={() => {
						if (!disabled) removeVariant(i);
					}}
					errors={zodIssuesForArrayItemErrors(validationIssues, 'variants', i)}
					refBase={values.name}
				/>
			{/each}

			{#if validationErrors.variants}
				<p class="text-sm text-destructive">{validationErrors.variants}</p>
			{/if}

			<!-- Array-level rule (needs ≥ 1 variant, refs must be unique) — no single row owns it. -->
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={addVariant}
				{disabled}
				class="self-start"
			>
				Agregar variante
			</Button>
		</CardContent>
	</Card>

	<!-- Publish decision last — the final call before creating the product. -->
	<ProductStatusCard bind:status={values.status} />
{/snippet}
