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
	title="Tablas de charcutería"
	description="Elige un tamaño — chica, mediana o grande. Tablas de charcutería distintivas de Vindima."
/>

<Section
	yPadding="none"
	contain={false}
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<img
		src={ASSETS_DATA.BOARD}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-32 -right-24 w-80 opacity-10"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative {PAGE_CONTAINER}">
		<Button href="{resolve('/')}#shop" class="mb-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>

		<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">
					Tienda · Para compartir
				</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
				>
					Tablas de charcutería
				</h1>
			</div>
			<p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
				Elige un tamaño — chica, mediana o grande. Los miembros del Club ahorran 10% en cada tabla.
			</p>
		</div>

		<CategoryProductGrid
			category="tablas"
			featuredBadge="Especialidad"
			class="grid-cols-1 gap-4 sm:grid-cols-2"
		/>
	</div>
</Section>
