<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Card, CardDescription, CardTitle } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';

	type CategoryCard = {
		path:
			| '/shop/vinos-de-autor'
			| '/shop/tablas'
			| '/shop/tapas'
			| '/shop/hogazas'
			| '/shop/bebidas'
			| '/shop/bowls';
		title: () => string;
		description: () => string;
		priceRange: () => string;
		image: { src: string; alt: () => string; class?: string };
	};

	const categories: CategoryCard[] = [
		{
			path: '/shop/vinos-de-autor',
			title: () => 'Vinos de Autor',
			description: () => 'Selección de la bodega, solo por botella',
			priceRange: () => '$560 – $1,200',
			image: {
				src: ASSETS_DATA.WINE_BOTTLE,
				alt: () => 'Vinos de Autor',
				class: 'h-36'
			}
		},
		{
			path: '/shop/tablas',
			title: () => 'Tablas',
			description: () => 'Charcutería y queso para compartir',
			priceRange: () => '$650 – $2,380',
			image: {
				src: ASSETS_DATA.BOARD,
				alt: () => 'Tabla de charcutería',
				class: 'h-32 self-end'
			}
		},
		{
			path: '/shop/tapas',
			title: () => 'Tapas',
			description: () => 'Bocados para acompañar tu copa',
			priceRange: () => '$55 – $95',
			image: {
				src: ASSETS_DATA.TAPA,
				alt: () => 'Tapas',
				class: 'h-32'
			}
		},
		{
			path: '/shop/hogazas',
			title: () => 'Hogazas',
			description: () => 'Pan artesanal de masa madre',
			priceRange: () => '$120 – $260',
			image: {
				src: ASSETS_DATA.CHEESE,
				alt: () => 'Hogazas',
				class: 'h-32'
			}
		},
		{
			path: '/shop/bebidas',
			title: () => 'Bebidas',
			description: () => 'Vino de autor por copa y botella',
			priceRange: () => '$90 – $1,200',
			image: {
				src: ASSETS_DATA.GLASS_SOFT,
				alt: () => 'Bebidas',
				class: 'h-36 self-end'
			}
		},
		{
			path: '/shop/bowls',
			title: () => 'Bowls',
			description: () => 'Frescos, de temporada',
			priceRange: () => '$110 – $190',
			image: {
				src: ASSETS_DATA.BOWL_PLATTER,
				alt: () => 'Bowls',
				class: 'h-32'
			}
		}
	];
</script>

<Section id="shop" yPadding="none" class="bg-secondary py-16 pb-24 sm:pb-28">
	<div class="mb-14 text-center">
		<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Explora el menú</p>

		<h2
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			De la cava a tu mesa
		</h2>

		<p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
			Seis categorías para montar tu mesa. Toca una para ver el menú completo y hacer tu pedido.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each categories as category (category.path)}
			<a href={resolve(category.path)} class="group block no-underline">
				<Card
					class="h-full items-center gap-3 rounded-lg border-primary bg-card px-6 py-6 text-center shadow-brand-subtle transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-lift"
				>
					<div class="flex h-36 w-full items-center justify-center">
						<img
							src={category.image.src}
							alt={category.image.alt()}
							class={category.image.class}
							loading="lazy"
							decoding="async"
						/>
					</div>

					<CardTitle
						class="font-display text-2xl font-semibold tracking-wide text-accent uppercase"
					>
						{category.title()}
					</CardTitle>

					<CardDescription class="text-xs leading-snug">
						{category.description()}
					</CardDescription>

					<span class="font-display text-lg font-semibold text-chart-2">
						{category.priceRange()}
					</span>
				</Card>
			</a>
		{/each}
	</div>
</Section>
