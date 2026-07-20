<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA, COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';
</script>

<SvelteHead
	title="Bowls"
	description="Platillos ligeros con productos del mercado. Ideales para media tarde con una copa en Vindima."
/>

<Section
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<a
		href="{resolve('/')}#shop"
		class="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
	>
		← Volver a la tienda
	</a>

	<div class="mb-8 flex flex-wrap items-center gap-7">
		<img
			src={ASSETS_DATA.BOWL_PLATTER}
			alt="Bowls"
			class="h-32 shrink-0"
			loading="lazy"
			decoding="async"
		/>

		<div>
			<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">
				Frescos y de temporada
			</p>

			<h1
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				Bowls
			</h1>

			<p class="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
				Platillos ligeros con productos del mercado. Ideales para media tarde con una copa.
			</p>
		</div>
	</div>

	<CategoryProductGrid category="bowls" />

	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5 py-5"
	>
		<p class="text-sm leading-snug text-accent">Arma tu bowl para llevar.</p>

		<Button
			href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
			target="_blank"
			rel="noopener noreferrer"
			variant="whatsapp"
		>
			Pedir por WhatsApp
		</Button>
	</div>
</Section>
