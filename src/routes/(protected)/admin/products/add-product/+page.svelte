<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { productCategoriesClass } from '@/features/products/classes/productCategoriesClass.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AddProductHeader from '@/components/pages/(protected)/admin/add-product/add-product-header.svelte';
	import VariantFormCard from '@/features/productVariants/components/variant-form-card.svelte';
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import { Button } from '@/components/ui/button/index.js';
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
		type CreateProductInput
	} from '@/shared/features/products/schemas/productsSchemas';

	// FORMS
	import { createProductSections } from '@/shared/features/products/forms/createProductForm';

	// UTILS
	import { zodIssuesForArrayItem } from '@/shared/utils/validationUtils';

	// TYPES
	import type { MutationFormExtraFieldsProps } from '@/components/ui/mutation-form/types';

	// Category options come from the DB via the admin layout's shared subscription —
	// the owner picks, never types (typo-proof).
	const sections = $derived(createProductSections(productCategoriesClass.options));

	let values = $state<CreateProductInput>({
		slug: '',
		name: '',
		description: '',
		images: [],
		category: '',
		featured: false,
		variants: [{ ref: '', label: '', priceMinor: 0, available: true, sortOrder: 0 }]
	});

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
</script>

<SvelteHead title="Nuevo producto" noindex description="Crea un nuevo producto en el catálogo de Vindima." />

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<AddProductHeader />

	<ConvexMutationForm
		bind:values
		schema={createProductFormSchema}
		{sections}
		runFunction={api.tables.products.mutations.createProduct.createProduct}
		submitLabel="Crear producto"
		resetOnSuccess={false}
		onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
		{extraFields}
	/>
</section>

{#snippet extraFields({ errors, issues }: MutationFormExtraFieldsProps<CreateProductInput>)}
	<!-- Variants — an array editor, so it can't be a declared section; styled as one. -->
	<Card>
		<CardHeader>
			<CardTitle>Variantes</CardTitle>
			<CardDescription>
				Lo que vendes — al menos una. La referencia es permanente una vez creada.
			</CardDescription>
		</CardHeader>
		
		<CardContent class="flex flex-col gap-3">
			{#each variantIndexes as i (i)}
				<VariantFormCard
					index={i}
					bind:variant={values.variants[i]}
					canRemove={values.variants.length > 1}
					onRemove={() => removeVariant(i)}
					errors={zodIssuesForArrayItem(issues, 'variants', i)}
					refBase={values.slug || values.name}
				/>
			{/each}

			<!-- Array-level rule (needs ≥ 1 variant, refs must be unique) — no single row owns it. -->
			{#if errors.variants}
				<p class="text-sm text-destructive">{errors.variants}</p>
			{/if}

			<Button type="button" variant="outline" size="sm" onclick={addVariant} class="self-start">
				Agregar variante
			</Button>
		</CardContent>
	</Card>
{/snippet}
