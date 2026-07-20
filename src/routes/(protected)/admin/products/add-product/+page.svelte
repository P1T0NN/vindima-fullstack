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
	import AddProductVariantCard from '@/components/pages/(protected)/admin/add-product/add-product-variant-card.svelte';
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
		createProductSchema,
		type CreateProductInput
	} from '@/shared/features/products/schemas/productsSchemas';

	// FORMS
	import { createProductSections } from '@/shared/features/products/forms/createProductForm';

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
		sortOrder: 0,
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

<SvelteHead title="New product" />

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<AddProductHeader />

	<ConvexMutationForm
		bind:values
		schema={createProductSchema}
		{sections}
		runFunction={api.tables.products.mutations.createProduct.createProduct}
		submitLabel="Create product"
		resetOnSuccess={false}
		onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
		{extraFields}
	/>
</section>

{#snippet extraFields()}
	<!-- Variants — an array editor, so it can't be a declared section; styled as one. -->
	<Card>
		<CardHeader>
			<CardTitle>Variants</CardTitle>
			<CardDescription>
				What you sell — at least one. The reference is permanent once created.
			</CardDescription>
		</CardHeader>
		
		<CardContent class="flex flex-col gap-3">
			{#each variantIndexes as i (i)}
				<AddProductVariantCard
					index={i}
					bind:variant={values.variants[i]}
					canRemove={values.variants.length > 1}
					onRemove={() => removeVariant(i)}
				/>
			{/each}

			<Button type="button" variant="outline" size="sm" onclick={addVariant} class="self-start">
				Add variant
			</Button>
		</CardContent>
	</Card>
{/snippet}
