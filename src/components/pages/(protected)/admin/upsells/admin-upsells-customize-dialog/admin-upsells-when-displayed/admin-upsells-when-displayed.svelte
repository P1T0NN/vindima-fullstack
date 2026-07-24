<script lang="ts">
	// "¿Cuándo se muestra?" — the WHEN half of the rule form (§8.2). Composes the type cards
	// and the per-type picker; the dialog only binds the resulting kind/slug values it needs
	// for validation + save.

	// COMPONENTS
	import AdminUpsellsChooseType from './admin-upsells-choose-type.svelte';
	import AdminUpsellsChooseProduct from './admin-upsells-choose-product/admin-upsells-choose-product.svelte';
	import AdminUpsellsChooseCategory from './admin-upsells-choose-category.svelte';

	// TYPES
	import type { UpsellTrigger } from '@/shared/features/upsells/types/upsellsTypes';

	let {
		kind = $bindable('product'),
		productSlug = $bindable(''),
		productLabel = $bindable(''),
		categorySlug = $bindable(''),
		duplicate = false
	}: {
		kind?: UpsellTrigger['kind'];
		productSlug?: string;
		/** Display name of the picked trigger product (shown without the full catalog). */
		productLabel?: string;
		categorySlug?: string;
		/** Another rule already uses this trigger — show the inline "ya existe" warning. */
		duplicate?: boolean;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<p class="text-sm font-medium">¿Cuándo se muestra?</p>

	<AdminUpsellsChooseType bind:kind />

	{#if kind === 'product'}
		<AdminUpsellsChooseProduct bind:productSlug bind:productLabel />
	{:else if kind === 'category'}
		<AdminUpsellsChooseCategory bind:value={categorySlug} />
	{/if}

	{#if duplicate}
		<p class="text-xs text-destructive">
			Ya existe una sugerencia para este disparador. Edítala en su lugar.
		</p>
	{/if}
</div>
