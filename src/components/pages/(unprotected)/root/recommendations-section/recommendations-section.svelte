<script lang="ts">
	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';
	import { cn } from '@/utils/utils.js';

	type PairingChip = { label: string; href: string };
	type WineCard = {
		name: string;
		variety: string;
		photo: string;
		note: string;
		service: string;
		pairings: PairingChip[];
	};

	// Category pairings/links carry `/shop/<slug>` strings; the storefront is one dynamic
	// route (`/shop/[category]`) that serves every slug, so these are plain hrefs now.
	const shopHref = (href: string) => appHref(href);

	const wines: WineCard[] = [
		{
			name: 'Paradoja Blanc',
			variety: 'Sauvignon Blanc Orgánico',
			photo: '/shop/opt/vinos-de-autor/paradoja-blanc-640w.webp',
			note: `
				Bouquet potente,  intensos aromas primarios a piña, durazno y manzana verde; y ligeras notas herbales y de pimiento verde. 
				100% Orgánico. Sin sulfitos añadidos. Certificación orgánica  en Estados Unidos, México y Canadá.
			`,
			service: '8-10 °C',
			pairings: [
				{ label: 'Tabla 4 Estaciones', href: '/shop/tablas' },
				{ label: 'Hogaza Brie & Romero', href: '/shop/hogazas' },
				{ label: "Bowl dormancia", href: '/shop/bowls'}
			]
		},
		{
			name: 'Piensos',
			variety: 'Malbec Orgánico',
			photo: '/shop/opt/vinos-de-autor/piensos-640w.webp',
			note: `
				De color violáceo y bouquet medio; aromas primarios de moras, frutos del bosque y flor de jamaica, con notas de violeta, lavanda y eucalipto, aromas secundarios con ligeras notas especiadas.
				100% Orgánico. Sin sulfitos añadidos. Certificación orgánica  en Estados Unidos, México y Canadá.
			`,
			service: '14-16 °C',
			pairings: [
				{ label: 'Tabla 4 Estaciones', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' },
				{ label: 'Picoteo', href: '/shop/tapas' }
			]
		},
		{
			name: 'Postos',
			variety: 'Tempranillo Orgánico',
			photo: '/shop/opt/vinos-de-autor/postos-640w.webp',
			note: `
				De color atejado, de bouquet potente; aromas primarios a frutos rojos maduros, notas de cereza negra y aromas secundariosde clavo y madera avainillada. Elaborado con uva 100% orgánica.
				Certificación orgánica en Estados Unidos, México y Canadá. Bajo en Sulfitos. Crianza en Barrica Francesa
			`,
			service: '16-18 °C',
			pairings: [
				{ label: 'Tabla Envero', href: '/shop/tablas' },
				{ label: 'Tabla Vindima', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' },
				{ label: 'Tortilla Española', href: '/shop/tapas' }
			]
		},
		{
			name: 'Paradoja Gran Reserva',
			variety: 'Malbec Orgánico',
			photo: '/shop/opt/vinos-de-autor/paradoja-gran-640w.webp',
			note: `
				Vino de color violáceo intenso, de capa media y cuerpo acentuado, con un bouquet potente.
				Aromas primarios a frutos negros compotados como ciruela pasa y violetas, aromas secundarios a roble con ligeros toques de miel, especias y clavo.

				Elaborado con uva 100% orgánica.
				Certificación orgánica reconocida en Estados Unidos, México y Canadá
				Bajo en Sulfitos
				Crianza en Barrica Francesa
			`,
			service: '17-18 °C',
			pairings: [
				{ label: 'Tabla Vindima', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' }
			]
		}
	];

	const chipClass =
		'rounded-full border border-primary/50 bg-primary/14 px-3.5 py-2 text-[11.5px] font-medium tracking-wide text-accent no-underline transition-colors hover:bg-primary/25';
</script>

<Section
	id="maridajes"
	ariaLabelledby="maridajes-heading"
	contain={false}
	yPadding="none"
	surface="background"
	class="relative overflow-hidden pt-14 pb-16 sm:pb-20"
>
	<img
		src={ASSETS_DATA.OLIVES}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-25 -right-12 hidden w-55 opacity-15 lg:block"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={ASSETS_DATA.OLIVE}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-140 -left-8 hidden w-35 rotate-16 opacity-15 lg:block"
		loading="lazy"
		decoding="async"
	/>

	<div class={cn(PAGE_CONTAINER, 'relative')}>
		<div class="mb-12.5 text-center">
			<p class="mb-4 text-xs font-medium tracking-widest text-gold-ink uppercase">
				De la copa a la mesa
			</p>
			<h2
				id="maridajes-heading"
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				Maridajes
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
				Nuestros vinos de Bodegas de la Parra y con qué platillos de la casa brillan.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each wines as wine (wine.name)}
				<Card class="flex-row gap-0 overflow-hidden rounded-xl border-0 bg-card p-0">
					<img
						src={wine.photo}
						alt="Botella de {wine.name}"
						class="w-30 shrink-0 self-stretch object-cover sm:w-37.5"
						loading="lazy"
						decoding="async"
					/>

					<div class="flex min-w-0 flex-1 flex-col">
						<div
							class="flex flex-wrap items-center justify-between gap-2.5 bg-accent px-5 py-3.5 sm:flex-nowrap"
						>
							<h3
								class="font-display text-[22px] leading-tight font-semibold tracking-[0.02em] text-accent-foreground uppercase"
							>
								{wine.name}
							</h3>
							<span class="shrink-0 text-[10px] font-medium tracking-[0.05em] text-primary">
								{wine.variety}
							</span>
						</div>

						<div class="flex flex-1 flex-col gap-2.5 px-5 py-4.5">
							<p class="text-[12.5px] leading-relaxed text-foreground/70">
								{wine.note} Servicio {wine.service}.
							</p>
							<div class="mt-auto flex flex-wrap gap-2">
								{#each wine.pairings as chip (chip.label)}
									<a href={shopHref(chip.href)} class={chipClass}>{chip.label}</a>
								{/each}
							</div>
						</div>
					</div>
				</Card>
			{/each}
		</div>
	</div>
</Section>
