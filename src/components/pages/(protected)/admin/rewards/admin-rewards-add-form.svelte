<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import SelectField from '@/components/ui/mutation-form/select-field.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import AdminRewardsAddFormLoading from './loading/admin-rewards-add-form-loading.svelte';

	// SCHEMAS
	import {
		addRewardItemFormSchema,
		type AddRewardItemFormInput
	} from '@/shared/features/rewards/schemas/rewardsSchemas';

	// FORMS
	import { createAddRewardItemFields } from '@/shared/features/rewards/forms/addRewardItemForm';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { MutationFormFieldSnippetProps } from '@/components/ui/mutation-form/types';

	// Catalog for the add-picker; the current-items list lives on `AdminRewardsTable`
	// (both are live, so they can't drift).
	const catalogQuery = useQuery(
		api.tables.products.queries.fetchRewardCatalog.fetchRewardCatalog,
		() => ({ paginationOpts: { numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE, cursor: null } })
	);
	const catalog = $derived(catalogQuery.data?.page as AdminProductRow[] | undefined);

	// Active products with ≥1 available, not-yet-reward variant.
	const candidates = $derived(
		(catalog ?? []).filter(
			(product) =>
				product.status === 'active' &&
				product.variants.some((variant) => variant.available && variant.rewardEligible !== true)
		)
	);

	let values = $state<AddRewardItemFormInput>({ productId: '', variantId: '' });

	const selectedProduct = $derived(candidates.find((p) => p._id === values.productId));
	const addableVariants = $derived(
		(selectedProduct?.variants ?? []).filter((v) => v.available && v.rewardEligible !== true)
	);

	const fields = $derived(
		createAddRewardItemFields({
			productOptions: candidates.map((p) => ({ value: p._id, label: p.name })),
			variantOptions: addableVariants.map((v) => ({
				value: v._id,
				label: v.label ?? v.ref
			})),
			showVariant: addableVariants.length > 1,
			disabled: candidates.length === 0
		})
	);

	function syncVariantForProduct(productId: string) {
		const product = candidates.find((p) => p._id === productId);
		const variants = (product?.variants ?? []).filter(
			(v) => v.available && v.rewardEligible !== true
		);
		// Single-variant products need no second pick — auto-select it.
		values.variantId = variants.length === 1 ? variants[0]._id : '';
	}
</script>

{#if catalogQuery.error}
	<ErrorComponent
		variant="alert"
		title="No se pudieron cargar los artículos de recompensa"
		description="Algo salió mal al obtener el catálogo. Inténtalo de nuevo."
	/>
{:else if catalogQuery.isLoading}
	<AdminRewardsAddFormLoading />
{:else}
	<ConvexMutationForm
		bind:values
		{fields}
		schema={addRewardItemFormSchema}
		runFunction={api.tables.productVariants.mutations.setVariantRewardEligible.setVariantRewardEligible}
		transformArgs={(_args, v) => ({ variantId: v.variantId, eligible: true })}
		submitLabel="Agregar artículo de recompensa"
		customFields={{ productId: productIdField }}
		class="max-w-lg gap-4"
	/>
{/if}

{#snippet productIdField({
	field,
	value,
	setValue,
	error,
	inputId
}: MutationFormFieldSnippetProps<AddRewardItemFormInput>)}
	<SelectField
		{field}
		{inputId}
		{value}
		setValue={(next) => {
			setValue(next);
			syncVariantForProduct(typeof next === 'string' ? next : '');
		}}
		invalid={!!error}
	/>
{/snippet}
