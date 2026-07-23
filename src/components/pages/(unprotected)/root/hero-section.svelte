<script lang="ts">
	// LIBRARIES
	import Autoplay from 'embla-carousel-autoplay';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Carousel from '@/components/ui/carousel/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { cn } from '@/utils/utils.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	const HERO_CAROUSEL_SLIDES = [
		{
			src: '/root/opt/hero-carousel-1-1280w.webp',
			alt: 'Foto del lugar 1'
		},
		{
			src: '/root/opt/hero-carousel-2-1280w.webp',
			alt: 'Foto del lugar 2'
		},
		{
			src: '/root/opt/hero-carousel-3-1280w.webp',
			alt: 'Foto del lugar 3'
		}
	] as const;

	const autoplay = Autoplay({
		delay: 1500,
		stopOnInteraction: false,
		stopOnMouseEnter: false
	});
</script>

<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden border-b border-border bg-background"
>
	<div class={cn(PAGE_CONTAINER, 'py-10 pb-11')}>
		<div
			class="relative flex min-h-hero-lg items-center border border-primary/60 px-6 py-17.5 sm:px-14"
		>
			<span
				class="pointer-events-none absolute -top-px -left-px size-6 border-t-2 border-l-2 border-primary"
				aria-hidden="true"
			></span>
			<span
				class="pointer-events-none absolute -top-px -right-px size-6 border-t-2 border-r-2 border-primary"
				aria-hidden="true"
			></span>
			<span
				class="pointer-events-none absolute -bottom-px -left-px size-6 border-b-2 border-l-2 border-primary"
				aria-hidden="true"
			></span>
			<span
				class="pointer-events-none absolute -right-px -bottom-px size-6 border-r-2 border-b-2 border-primary"
				aria-hidden="true"
			></span>

			<div class="relative z-10 max-w-155">
				<div class="mb-6 flex items-center gap-3.5">
					<span class="h-px w-12 bg-primary" aria-hidden="true"></span>
					<p class="font-display text-lg text-chart-2 italic">
						Para grandes anfitriones · Desde 2023
					</p>
				</div>

				<h1
					class="font-display text-4xl leading-[0.96] font-semibold tracking-[0.01em] text-accent uppercase sm:text-5xl lg:text-[68px]"
				>
					Vino de autor.<br />
					Charcutería.<br />
					Experiencias.
				</h1>

				<p class="mt-6.5 mb-9 max-w-105 text-[15px] leading-[1.8] text-muted-foreground">
					Una bodega orgánica en Aguascalientes. Tablas de temporada, tapas y vino seleccionado para
					reunir a los tuyos alrededor de la mesa.
				</p>

				<div class="flex flex-wrap gap-3.5">
					<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.SHOP)} size="lg">
						Ir a la tienda
					</Button>

					<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.MARIDAJES)} variant="outline" size="lg">
						Ver maridajes
					</Button>
				</div>
			</div>

			<img
				src={ASSETS_DATA.BOTTLE}
				alt="Botella de vino Vindima"
				class="pointer-events-none absolute right-8.5 -bottom-11 z-10 hidden h-141.5 drop-shadow-brand-lg lg:block"
				width="280"
				height="566"
				loading="eager"
				decoding="async"
			/>
			<img
				src={ASSETS_DATA.GLASS}
				alt="Copa de vino"
				class="pointer-events-none absolute right-61.5 -bottom-7.5 z-1 hidden h-75 -rotate-3 drop-shadow-brand-md lg:block"
				width="150"
				height="300"
				loading="eager"
				decoding="async"
			/>
		</div>

		<Carousel.Root
			opts={{ loop: true }}
			plugins={[autoplay]}
			class="mt-7 border border-primary/60"
			aria-label="Galería del lugar"
		>
			<Carousel.Content class="ms-0">
				{#each HERO_CAROUSEL_SLIDES as slide (slide.src)}
					<Carousel.Item class="ps-0">
						<img
							src={slide.src}
							alt={slide.alt}
							class="h-96 w-full object-cover"
							width="1280"
							height="384"
							loading="lazy"
							decoding="async"
						/>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
			<Carousel.Previous class="start-3 border-primary/60 bg-background/80" />
			<Carousel.Next class="end-3 border-primary/60 bg-background/80" />
		</Carousel.Root>
	</div>
</Section>
