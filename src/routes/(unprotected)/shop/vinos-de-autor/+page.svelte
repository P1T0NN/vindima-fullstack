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
	class="relative overflow-hidden bg-accent py-14 pb-24 sm:py-16 sm:pb-28"
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
		<a
			href="{resolve('/')}#shop"
			class="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase no-underline transition-colors hover:text-accent-foreground"
		>
			← Volver a la tienda
		</a>

		<div class="mb-8 flex flex-wrap items-center gap-7">
			<img
				src={ASSETS_DATA.BOTTLE}
				alt="Vinos de Autor"
				class="h-32.5 shrink-0"
				loading="lazy"
				decoding="async"
			/>
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-primary uppercase">Vino de autor</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent-foreground uppercase sm:text-5xl"
				>
					Vinos de Autor
				</h1>
				<p class="mt-3.5 max-w-md text-sm leading-relaxed text-accent-surface-muted">
					Selección de la bodega, solo por botella. Pregunta por el maridaje del día.
				</p>
			</div>
		</div>

		<CategoryProductGrid category="vinos-de-autor" addLabel="Agregar" />

		<p class="mt-10 mb-3.5 text-xs font-medium tracking-widest text-primary uppercase">
			Promociones
		</p>
		<div class="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
			{#each promotions as promo (promo.text)}
				<div class="flex items-center gap-3.5 rounded-lg border border-primary/50 px-5 py-4.5">
					<span class="shrink-0 font-display text-3xl leading-none font-semibold text-primary">
						{promo.discount}
					</span>
					<span class="text-[12.5px] leading-snug text-accent-surface-muted">{promo.text}</span>
				</div>
			{/each}
		</div>

		<div
			class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/35 bg-primary/10 px-5.5 py-5"
		>
			<p class="text-[13.5px] leading-snug text-accent-foreground">
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
