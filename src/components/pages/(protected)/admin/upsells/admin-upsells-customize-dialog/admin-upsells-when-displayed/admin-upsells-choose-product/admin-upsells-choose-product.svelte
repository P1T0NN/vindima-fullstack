<script lang="ts">
	// Trigger-product picker: no product yet → search; product picked → its name with a
	// "Cambiar" affordance. Both children write the bound slug/label themselves.

	// COMPONENTS
	import AdminUpsellsProductChosen from './admin-upsells-product-chosen.svelte';
	import AdminUpsellsProductSearch from './admin-upsells-product-search.svelte';

	let {
		productSlug = $bindable(''),
		productLabel = $bindable('')
	}: {
		productSlug?: string;
		/** Display name of the picked product (shown without the full catalog). */
		productLabel?: string;
	} = $props();
</script>

{#if productSlug}
	<AdminUpsellsProductChosen bind:productSlug bind:productLabel />
{:else}
	<AdminUpsellsProductSearch bind:productSlug bind:productLabel />
{/if}
