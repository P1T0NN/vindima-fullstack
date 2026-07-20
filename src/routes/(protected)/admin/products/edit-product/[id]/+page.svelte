<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import EditProductHeader from '@/components/pages/(protected)/admin/edit-product/edit-product-header.svelte';
	import EditProductForm from '@/components/pages/(protected)/admin/edit-product/edit-product-form.svelte';
	import EditProductLoading from '@/components/pages/(protected)/admin/edit-product/loading/edit-product-loading.svelte';
	import EditProductEmpty from '@/components/pages/(protected)/admin/edit-product/empty/edit-product-empty.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

	// `params.id` is `string | undefined` at the type level; `'skip'` the query while missing.
	const productId = $derived(page.params.id);

	const productQuery = useQuery(api.tables.products.queries.fetchProductById.fetchProductById, () =>
		productId ? { productId } : 'skip'
	);
	const product = $derived(productQuery.data as AdminProductRow | null | undefined);
</script>

<SvelteHead title="Editar producto" noindex description="Edita un producto del catálogo de Vindima." />

<section class="{PAGE_CONTAINER} flex flex-col gap-6 py-4 md:py-6">
	<EditProductHeader />

	{#if productQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar el producto"
			description="No pudimos cargar este producto. Inténtalo de nuevo."
		/>
	{:else if product === null}
		<EditProductEmpty />
	{:else if product === undefined}
		<EditProductLoading />
	{:else}
		{#key product._id}
			<EditProductForm {product} />
		{/key}
	{/if}
</section>
