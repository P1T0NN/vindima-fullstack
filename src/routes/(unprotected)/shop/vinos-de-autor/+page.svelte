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

	const promotions = [
		{ discount: '−10%', text: 'En la compra de 3 o más botellas' },
		{ discount: '−12%', text: 'En la caja de 12 botellas' },
		{ discount: '−10%', text: 'Botella + tabla, hogaza o cualquier alimento' }
	] as const;
</script>

<SvelteHead
	title="Vinos de Autor"
	description="Selección de la bodega, solo por botella. Pregunta por el maridaje del día en Vindima."
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
		class="pointer-events-none absolute top-15 -right-8 w-57.5 opacity-15"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={ASSETS_DATA.OLIVES}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute bottom-20 -left-10 w-50 opacity-15"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative {PAGE_CONTAINER} max-w-270">
		<Button href="{resolve('/')}#shop" class="mb-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>

		<div class="mb-8 flex flex-wrap items-center gap-7">
			<img
				src={ASSETS_DATA.BOTTLE}
				alt="Vinos de Autor"
				class="h-32.5 shrink-0"
				loading="lazy"
				decoding="async"
			/>
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Vino de autor</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
				>
					Vinos de Autor
				</h1>
				<p class="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
					Selección de la bodega, solo por botella. Pregunta por el maridaje del día.
				</p>
			</div>
		</div>

		<CategoryProductGrid category="vinos-de-autor" addLabel="Agregar" />

		<p class="mt-10 mb-3.5 text-xs font-medium tracking-widest text-chart-2 uppercase">
			Promociones
		</p>
		<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
			{#each promotions as promo (promo.text)}
				<div class="flex items-center gap-3.5 rounded-lg border border-primary/40 px-5 py-4.5">
					<span class="shrink-0 font-display text-3xl leading-none font-semibold text-chart-2">
						{promo.discount}
					</span>
					<span class="text-[12.5px] leading-snug text-muted-foreground">{promo.text}</span>
				</div>
			{/each}
		</div>

		<div
			class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5.5 py-5"
		>
			<p class="text-[13.5px] leading-snug text-accent">
				¿Quieres una cata privada o botellas para tu evento?
			</p>
			<Button
				href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
				target="_blank"
				rel="noopener noreferrer"
				variant="whatsapp"
			>
				Ordenar por WhatsApp
			</Button>
		</div>
	</div>
</Section>
