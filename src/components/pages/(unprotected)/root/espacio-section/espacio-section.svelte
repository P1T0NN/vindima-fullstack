<script lang="ts">
	// LIBRARIES
	import Autoplay from 'embla-carousel-autoplay';
	import { MediaQuery } from 'svelte/reactivity';

	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import * as Carousel from '@/components/ui/carousel/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// TYPES
	import type { CarouselAPI } from '@/components/ui/carousel/context.js';

	// LUCIDE ICONS
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	/**
	 * Photographs of the table. Everything downstream derives from this list's length —
	 * slides, counter, progress track — so an eleventh photo is one entry and nothing else.
	 *
	 * The set spans three orientations (2.5:1 panoramas, ~1.2 landscapes, 0.70 portraits),
	 * which is why the frame is square: a center crop to 1:1 was checked against all ten and
	 * holds every subject, where a landscape frame cut the tops off the portraits.
	 */
	const ESPACIO_ENTRIES = [
		{
			slug: 'espacio-1',
			title: 'Tapas y montaditos',
			alt: 'Bandeja de montaditos: pan del día con quesos, embutidos y encurtidos.'
		},
		{
			slug: 'espacio-2',
			title: 'Vindima',
			alt: 'Postre de frutos rojos con granola, junto a una rebanada de tortilla y pan.'
		},
		{
			slug: 'espacio-3',
			title: 'Paradoja Malbec',
			alt: 'Vino Paradoja'
		},
		{
			slug: 'espacio-4',
			title: 'Noche de tabla',
			alt: 'Tabla servida de noche sobre la mesa de madera, con una copa de tinto al lado.'
		},
		{
			slug: 'espacio-5',
			title: 'Para llevar',
			alt: 'Cuatro cajas para llevar con charcutería, quesos, encurtidos y fruta.'
		},
		{
			slug: 'espacio-6',
			title: 'Tabla para dos',
			alt: 'Tabla en bandeja de madera, servida para dos, con vino y platos puestos.'
		},
		{
			slug: 'espacio-7',
			title: 'En la terraza',
			alt: 'Tabla en la terraza con una botella de Paradoja Blanc y dos copas de vino blanco.'
		},
		{
			slug: 'espacio-8',
			title: 'Bowls para llevar',
			alt: 'Bowls para llevar'
		},
		{
			slug: 'espacio-9',
			title: 'Servida a la mesa',
			alt: 'Una tabla recién montada, llevada a la mesa en su bandeja de madera.'
		},
		{
			slug: 'espacio-10',
			title: 'Clericot',
			alt: 'Postre de frutos rojos y una rebanada de tortilla, servidos al cierre de la noche.'
		},
		{
			slug: 'espacio-11',
			title: 'Tapas',
			alt: 'Tapas de queso con aceituna y jamón'
		}
	] as const;

	const TOTAL = ESPACIO_ENTRIES.length;
	const AUTOPLAY_DELAY_MS = 4000;

	const src = (slug: string, width: number) => `/root/opt/${slug}-${width}w.webp`;

	/**
	 * Autoplay runs continuously and yields only to direct manipulation. `stopOnInteraction:
	 * false` is what makes a drag pause the drift and then resume from wherever it landed,
	 * and leaving `stopOnMouseEnter` off keeps it running under an idle pointer.
	 * `stopOnFocusIn` stays at its default so a keyboard user tabbing into the rail isn't
	 * fighting it; focus out resumes. The visible toggle is what satisfies WCAG 2.2.2.
	 */
	const reducedMotion = new MediaQuery('(prefers-reduced-motion: reduce)');

	const autoplay = Autoplay({
		delay: AUTOPLAY_DELAY_MS,
		stopOnInteraction: false,
		stopOnMouseEnter: false
	});

	let api = $state<CarouselAPI | undefined>(undefined);
	let selected = $state(0);
	let playing = $state(true);

	function onApi(carousel: CarouselAPI | undefined) {
		api = carousel;
		if (!carousel) return;
		selected = carousel.selectedScrollSnap();
		carousel.on('select', () => (selected = carousel.selectedScrollSnap()));
	}

	/** Embla's own plugin handle, so the toggle and the reduced-motion opt-out agree. */
	const autoplayApi = $derived(api?.plugins()?.autoplay);

	$effect(() => {
		if (!autoplayApi) return;
		if (reducedMotion.current) {
			autoplayApi.stop();
			playing = false;
		}
	});

	function toggleAutoplay() {
		if (!autoplayApi) return;
		if (playing) autoplayApi.stop();
		else autoplayApi.play();
		playing = !playing;
	}

	const railButtonClass =
		'inline-flex size-9 cursor-pointer items-center justify-center rounded-[2px] border border-primary/40 text-primary transition-colors outline-none hover:border-primary hover:bg-primary/10 focus-visible:border-primary focus-visible:bg-primary/10';
</script>

<Section
	id="espacio"
	ariaLabelledby="espacio-heading"
	yPadding="none"
	class="relative overflow-hidden bg-accent py-20 sm:py-24"
>
	<img
		src={ASSETS_DATA.OLIVES}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute -top-12 -right-16 hidden w-64 opacity-10 sm:block"
		loading="lazy"
		decoding="async"
	/>

	<header class="max-w-2xl">
		<div class="mb-5 flex items-center gap-3.5">
			<span class="h-px w-12 bg-primary" aria-hidden="true"></span>
			<p class="text-xs font-medium tracking-widest text-primary uppercase">La mesa</p>
		</div>

		<h2
			id="espacio-heading"
			class="font-display text-4xl leading-none font-semibold tracking-[0.01em] text-accent-foreground uppercase sm:text-5xl lg:text-[56px]"
		>
			Nuestro espacio
		</h2>

		<p class="mt-5 max-w-prose text-[15px] leading-[1.85] text-accent-surface-muted">
			Nuestro espacio es la mesa: lo que servimos en ella y la gente que se sienta alrededor. Tablas
			de mediodía, cajas para llevar y noches que terminan con postre, aquí en Aguascalientes.
		</p>
	</header>

	<div class="espacio-stage mt-12 sm:mt-14">
		<Carousel.Root
			opts={{ loop: true, align: 'start' }}
			plugins={[autoplay]}
			setApi={onApi}
			aria-label="Fotos de la mesa"
		>
			<Carousel.Content>
				{#each ESPACIO_ENTRIES as entry, i (entry.slug)}
					<!-- Fractional bases on purpose: a partly visible slide at the right edge is what
					     tells the visitor the rail continues, so it never divides evenly. -->
					<Carousel.Item
						class="basis-[78%] sm:basis-[46%] lg:basis-[31%]"
						aria-label="{i + 1} de {TOTAL}"
					>
						<figure class="m-0">
							<img
								src={src(entry.slug, 960)}
								srcset="{src(entry.slug, 640)} 640w, {src(entry.slug, 960)} 960w, {src(
									entry.slug,
									1280
								)} 1280w"
								sizes="(min-width: 1024px) 31vw, (min-width: 640px) 46vw, 78vw"
								alt={entry.alt}
								class="aspect-square w-full rounded-lg border border-primary/25 object-cover"
								loading="lazy"
								decoding="async"
							/>

							<figcaption class="mt-4 flex items-baseline gap-3">
								<span class="font-display text-lg leading-none text-primary tabular-nums">
									{String(i + 1).padStart(2, '0')}
								</span>
								<span
									class="text-xs leading-none font-medium tracking-widest text-accent-surface-muted uppercase"
								>
									{entry.title}
								</span>
							</figcaption>
						</figure>
					</Carousel.Item>
				{/each}
			</Carousel.Content>
		</Carousel.Root>

		<div class="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
			<div class="flex items-center gap-4">
				<p class="font-display text-lg leading-none text-primary tabular-nums">
					<span class="sr-only">Foto </span>{String(selected + 1).padStart(2, '0')}
					<span class="text-accent-surface-muted">/ {TOTAL}</span>
				</p>

				<!-- Position along the rail, not a countdown: the segment is one slide wide and
				     travels by its own width, so it reads as where you are in the set. -->
				<div class="h-px w-32 bg-primary/20 sm:w-44" aria-hidden="true">
					<div
						class="h-px bg-primary transition-transform duration-500 ease-out"
						style="width: {100 / TOTAL}%; transform: translateX({selected * 100}%)"
					></div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				<button
					type="button"
					onclick={() => api?.scrollPrev()}
					class={railButtonClass}
					aria-label="Foto anterior"
				>
					<ChevronLeftIcon class="size-4" strokeWidth={1.6} aria-hidden="true" />
				</button>

				<button
					type="button"
					onclick={() => api?.scrollNext()}
					class={railButtonClass}
					aria-label="Foto siguiente"
				>
					<ChevronRightIcon class="size-4" strokeWidth={1.6} aria-hidden="true" />
				</button>

				<button
					type="button"
					onclick={toggleAutoplay}
					class="ms-2 cursor-pointer rounded-[2px] text-xs font-medium tracking-widest text-primary uppercase underline-offset-4 transition-opacity outline-none hover:opacity-75 focus-visible:underline"
				>
					{playing ? 'Pausar' : 'Reproducir'}
				</button>
			</div>
		</div>
	</div>
</Section>

<style>
	/* Scroll-driven reveal with no JS. Gated behind @supports so browsers without
	   view-timelines never see the hidden start state, and off entirely for reduced motion. */
	@supports (animation-timeline: view()) {
		@media (prefers-reduced-motion: no-preference) {
			.espacio-stage {
				animation: espacio-enter linear both;
				animation-timeline: view();
				animation-range: entry 5% cover 26%;
			}
		}
	}

	@keyframes espacio-enter {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}
</style>
