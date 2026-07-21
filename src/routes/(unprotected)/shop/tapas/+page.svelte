<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
</script>

<SvelteHead
	title="Tapas"
	description="Tres platillos para acompañar tu copa. Elige uno o combínalos para la mesa en Vindima."
/>

<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<img
		src={ASSETS_DATA.TAPA}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-24 -left-10 w-48 -rotate-8 opacity-90"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={ASSETS_DATA.GLASS_SOFT}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute right-8 -bottom-8 w-36 opacity-50"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative {PAGE_CONTAINER}">
		<Button href="{resolve('/')}#shop" class="mb-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>

		<div class="mb-12 text-center">
			<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Para picar</p>
			<h1
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				Tapas
			</h1>
			<p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
				Tres platillos para acompañar tu copa. Elige uno o combínalos para la mesa.
			</p>
		</div>

		<CategoryProductGrid category="tapas" class="grid-cols-1 gap-4 sm:grid-cols-2" />
	</div>
</Section>
