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

	// SCHEMAS
	import {
		editProductFormSchema,
		type EditProductInput
	} from '@/shared/features/products/schemas/editProductSchemas';

	// FORMS
	import { editProductSections } from '@/shared/features/products/forms/editProductForm';

	// UTILS
	import { zodIssuesForArrayItem } from '@/shared/utils/validationUtils';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { Id } from '@/convex/_generated/dataModel';
	import type { MutationFormExtraFieldsProps } from '@/components/ui/mutation-form/types';

	let { product }: { product: AdminProductRow } = $props();

	// Category options come from the DB via the admin layout's shared subscription — the
	// owner picks, never types (typo-proof). The product's current slug preselects because
	// `values.category` already holds it.
	const sections = $derived(editProductSections(productCategoriesClass.options));

	// Form model — seeded ONCE from `product` (untracked; the route remounts this via `{#key}` when
	// the edited id changes, so capturing initial values here is correct).
	const seed = untrack(() => product);

	// Archived products keep their status: restoring is a deliberate action from the products
	// table, not a side effect of saving an edit. `undefined` = "don't touch it" (and
	// `transformArgs` drops the key entirely).
	const archived = seed.status === 'archived';

	let values = $state<EditProductInput>({
		name: seed.name,
		description: seed.description ?? '',
		// The current image rides along as a URL string (shown as "imagen existente"), so
		// saving without touching it keeps the product's image as-is.
		images: seed.images[0] ?? null,
		category: seed.category,
		status: seed.status === 'archived' ? undefined : seed.status,
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

	// Inject the route's productId + pending removals.
	function transformArgs(args: Record<string, unknown>) {
		const rest = { ...args };
		// Archived product — send no status at all rather than an explicit `undefined`.
		if (rest.status === undefined) delete rest.status;
		// One image in, a list out (`images[0]` is what the storefront shows). Cleared field →
		// omit the key so the mutation keeps the product's current image.
		const image = rest.images;
		if (typeof image === 'string' && image) rest.images = [image];
		else delete rest.images;
		return { ...rest, productId: product._id, removedVariantIds: [...removedVariantIds] };
	}
</script>

<ConvexMutationForm
	bind:values
	schema={editProductFormSchema}
	{sections}
	runFunction={api.tables.products.mutations.editProduct.editProduct}
	{transformArgs}
	submitLabel="Guardar cambios"
	resetOnSuccess={false}
	onSuccess={() => goto(ADMIN_PAGE_ENDPOINTS.PRODUCTS)}
	{extraFields}
/>

{#snippet extraFields({ errors, issues }: MutationFormExtraFieldsProps<EditProductInput>)}
	<!-- Variants — an array editor, so it can't be a declared section; styled as one. -->
	<Card>
		<CardHeader>
			<CardTitle>Variantes</CardTitle>
			<CardDescription>
				Lo que vendes — al menos una. Las referencias guardadas están bloqueadas; las nuevas deben
				ser únicas.
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
					refBase={seed.slug}
				/>
			{/each}

			<!-- Array-level rule (needs ≥ 1 variant, refs must be unique) — no single row owns it. -->
			{#if errors.variants}
				<p class="text-sm text-destructive">{errors.variants}</p>
			{/if}

			{#if removedVariantIds.length > 0}
				<!-- Pending only — nothing is written until Save changes. -->
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<span>
						{removedVariantIds.length === 1
							? '1 variante se eliminará al guardar.'
							: `${removedVariantIds.length} variantes se eliminarán al guardar.`}
					</span>
					<Button type="button" variant="ghost" size="sm" onclick={undoRemovals}>Deshacer</Button>
				</div>
			{/if}

			<EditProductAddVariant bind:variants={values.variants} />
		</CardContent>
	</Card>

	<!-- Publish decision last — the final call before saving. -->
	<ProductStatusCard bind:status={values.status} {archived} />
{/snippet}
