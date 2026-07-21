<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA, COMPANY_DATA } from '@/shared/config.js';
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
	title="Bebidas"
	description="Selección de bodega por copa y botella. Vinos de autor y maridajes de Vindima."
/>

<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<img
		src={ASSETS_DATA.BOTTLE}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-16 -right-8 w-56 opacity-15"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={ASSETS_DATA.GLASS_SOFT}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute bottom-5 -left-8 w-36 opacity-20"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative {PAGE_CONTAINER}">
		<Button href="{resolve('/')}#shop" class="mb-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>

		<div class="mb-8 flex flex-wrap items-center gap-7">
			<img
				src={ASSETS_DATA.GLASS}
				alt="Bebidas"
				class="h-32 shrink-0"
				loading="lazy"
				decoding="async"
			/>
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Vino de autor</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
				>
					Bebidas
				</h1>
				<p class="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
					Selección de bodega por copa y botella. Pregunta por el maridaje del día.
				</p>
			</div>
		</div>

		<CategoryProductGrid category="bebidas" />

		<div
			class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5 py-5"
		>
			<p class="text-sm leading-snug text-accent">
				¿Quieres una cata privada o botellas para tu evento?
			</p>
			<Button
				href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
				target="_blank"
				rel="noopener noreferrer"
				variant="whatsapp"
				class="h-auto px-6 py-4 text-xs tracking-wider uppercase"
			>
				Pedir por WhatsApp
			</Button>
		</div>
	</div>
</Section>
