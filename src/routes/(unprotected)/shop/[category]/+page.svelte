<script lang="ts">
	// COMPONENTS
	import CategoryPageContent from '@/components/pages/(unprotected)/shop/category-page-content.svelte';
	import CategoryPageLoading from '@/components/pages/(unprotected)/shop/loading/category-page-loading.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<!-- Experimental async Svelte: the content component top-level-awaits the (possibly
     streamed) page data. Direct hits arrive resolved (full SSR HTML — SEO + real 404);
     client-side navigations suspend into the pending skeleton. -->
<svelte:boundary>
	<CategoryPageContent pageData={data.pageData} />

	{#snippet pending()}
		<CategoryPageLoading />
	{/snippet}

	{#snippet failed()}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar la categoría"
			description="Algo salió mal al obtener los productos. Inténtalo de nuevo."
		/>
	{/snippet}
</svelte:boundary>
