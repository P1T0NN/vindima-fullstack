<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// CONFIG
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import CategoryProductGridLoading from '@/features/products/components/category-product-grid/category-product-grid-loading.svelte';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
</script>

<!-- Pending state for /shop/[category] while the streamed page data resolves (client-side
     navigations only — direct hits and crawlers get fully awaited SSR HTML). Mirrors the
     real page's layout so the swap-in causes no shift. -->
<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<div class="relative {PAGE_CONTAINER}">
		<Button href="{resolve('/')}#shop" class="mb-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>

		<div class="mb-12 flex flex-col items-center" aria-busy="true" aria-label="Cargando categoría">
			<Skeleton class="mb-4 h-3 w-28 rounded-sm" />
			<Skeleton class="h-10 w-64 rounded-sm sm:h-12" />
			<Skeleton class="mt-4 h-3 w-80 max-w-full rounded-sm" />
		</div>

		<CategoryProductGridLoading />
	</div>
</Section>
