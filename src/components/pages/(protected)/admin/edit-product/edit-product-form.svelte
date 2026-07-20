<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { untrack } from 'svelte';
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { productCategoriesClass } from '@/features/products/classes/productCategoriesClass.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import EditProductVariantCard from './edit-product-variant-card.svelte';
	import EditProductAddVariant from './edit-product-add-variant.svelte';
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
		editProductSchema,
		type EditProductInput
	} from '@/shared/features/products/schemas/editProductSchemas';

	// FORMS
	import { editProductSections } from '@/shared/features/products/forms/editProductForm';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { Id } from '@/convex/_generated/dataModel';

	let { product }: { product: AdminProductRow } = $props();

	// Category options come from the DB via the admin layout's shared subscription — the
	// owner picks, never types (typo-proof). The product's current slug preselects because
	// `values.category` already holds it.
	const sections = $derived(editProductSections(productCategoriesClass.options));

	// Form model — seeded ONCE from `product` (untracked; the route remounts this via `{#key}` when
	// the edited id changes, so capturing initial values here is correct).
	const seed = untrack(() => product);
	let values = $state<EditProductInput>({
		slug: seed.slug,
		name: seed.name,
		description: seed.description ?? '',
		images: [],
		category: seed.category,
		featured: seed.featured ?? false,
		sortOrder: seed.sortOrder,
		variants: seed.variants.map((v) => ({
			variantId: v._id,
			ref: v.ref,
			label: v.label ?? '',
			priceMinor: v.priceMinor,
			available: v.available,
			sortOrder: v.sortOrder
		}))
	});

	const variantIndexes = $derived([...values.variants.keys()]);

	// Pending removals (DeleteVariantSystemDesign.md §6) — client state ONLY until Save.
	// Removing a saved card queues its id here; navigating away without saving forgets it.
	let removedVariantIds = $state<Id<'productVariants'>[]>([]);

	function removeVariant(index: number) {
		const variantId = values.variants[index].variantId;
		if (variantId) removedVariantIds.push(variantId as Id<'productVariants'>);
		values.variants.splice(index, 1);
	}

	// Bulk undo: restore every pending removal from the untracked seed (original values).
	function undoRemovals() {
		for (const variantId of removedVariantIds) {
			const original = seed.variants.find((v) => v._id === variantId);
			if (!original) continue;
			values.variants.push({
				variantId: original._id,
				ref: original.ref,
				label: original.label ?? '',
				priceMinor: original.priceMinor,
				available: original.available,
				sortOrder: original.sortOrder
			});
		}
		removedVariantIds = [];
	}

	// Inject the route's productId + pending removals; drop the read-only slug
	// (editProduct doesn't accept it).
	function transformArgs(args: Record<string, unknown>) {
		const rest = { ...args };
		delete rest.slug;
		return { ...rest, productId: product._id, removedVariantIds: [...removedVariantIds] };
	}
</script>

<ConvexMutationForm
	bind:values
	schema={editProductSchema}
	{sections}
	runFunction={api.tables.products.mutations.editProduct.editProduct}
	{transformArgs}
	submitLabel="Save changes"
	resetOnSuccess={false}
	onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
	{extraFields}
/>

{#snippet extraFields()}
	<!-- Variants — an array editor, so it can't be a declared section; styled as one. -->
	<Card>
		<CardHeader>
			<CardTitle>Variants</CardTitle>
			<CardDescription>
				What you sell — at least one. Saved references are locked; new ones must be unique.
			</CardDescription>
		</CardHeader>
		
		<CardContent class="flex flex-col gap-3">
			{#each variantIndexes as i (i)}
				<EditProductVariantCard
					index={i}
					bind:variant={values.variants[i]}
					canRemove={values.variants.length > 1}
					onRemove={() => removeVariant(i)}
				/>
			{/each}

			{#if removedVariantIds.length > 0}
				<!-- Pending only — nothing is written until Save changes. -->
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<span>
						{removedVariantIds.length === 1
							? '1 variant will be removed when you save.'
							: `${removedVariantIds.length} variants will be removed when you save.`}
					</span>
					<Button type="button" variant="ghost" size="sm" onclick={undoRemovals}>Undo</Button>
				</div>
			{/if}

			<EditProductAddVariant bind:variants={values.variants} />
		</CardContent>
	</Card>
{/snippet}
