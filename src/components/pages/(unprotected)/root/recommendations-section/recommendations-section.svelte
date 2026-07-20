<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import * as Tabs from '@/components/ui/tabs/index.js';

	// UTILS
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';
	import { cn } from '@/utils/utils.js';

	type PairingChip = { label: string; href: string };
	type WineCard = {
		name: string;
		tag: string;
		note: string;
		service: string;
		pairings: PairingChip[];
		featured?: boolean;
	};
	type GuideRow = { dish: string; note?: string; wines: string };
	type WinePick = 'blanc' | 'piensos' | 'postos' | 'granreserva';
	type RecCard = { name: string; desc: string; href: string };

	const wines: WineCard[] = [
		{
			name: 'Paradoja Blanc',
			tag: 'Blanco',
			note: 'Cítricos, flor de azahar y un final mineral y fresco.',
			service: '8–10 °C',
			pairings: [
				{ label: 'Tabla 4 Estaciones', href: '/shop/tablas' },
				{ label: 'Hogaza Brie & Romero', href: '/shop/hogazas' }
			]
		},
		{
			name: 'Piensos',
			tag: 'Tinto joven',
			note: 'Frutos rojos frescos, taninos suaves y paso ligero.',
			service: '14–16 °C',
			pairings: [
				{ label: 'Tabla 4 Estaciones', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' },
				{ label: 'Picoteo', href: '/shop/tapas' }
			]
		},
		{
			name: 'Postos',
			tag: 'Tinto',
			note: 'Fruta negra madura, especias y notas de barrica.',
			service: '16–18 °C',
			pairings: [
				{ label: 'Tabla Envero', href: '/shop/tablas' },
				{ label: 'Tabla Vindima', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' },
				{ label: 'Tortilla Española', href: '/shop/tapas' }
			]
		},
		{
			name: 'Paradoja Gran Reserva',
			tag: 'Gran Reserva',
			note: 'Guarda larga: fruta compotada, vainilla y taninos sedosos.',
			service: '17–18 °C',
			featured: true,
			pairings: [
				{ label: 'Tabla Vindima', href: '/shop/tablas' },
				{ label: 'Hogaza Vindima', href: '/shop/hogazas' }
			]
		}
	];

	const guide: GuideRow[] = [
		{ dish: 'Tabla 4 Estaciones', wines: 'Paradoja Blanc o Piensos' },
		{ dish: 'Tabla Envero', wines: 'Postos' },
		{ dish: 'Tabla Vindima', wines: 'Postos o Paradoja Gran Reserva' },
		{ dish: 'Hogaza Brie & Romero', wines: 'Paradoja Blanc' },
		{
			dish: 'Hogaza Vindima',
			note: '(higos)',
			wines: 'Piensos, Postos o Paradoja Gran Reserva'
		},
		{ dish: 'Picoteo', wines: 'Piensos o Clericot' },
		{ dish: 'Tortilla Española', wines: 'Clericot o cualquiera de nuestros tintos' }
	];

	const winePicks: { id: WinePick; label: string }[] = [
		{ id: 'blanc', label: 'Paradoja Blanc' },
		{ id: 'piensos', label: 'Piensos' },
		{ id: 'postos', label: 'Postos' },
		{ id: 'granreserva', label: 'Gran Reserva' }
	];

	const wineRecs: Record<WinePick, RecCard[]> = {
		blanc: [
			{
				name: 'Tabla 4 Estaciones',
				desc: 'Quesos de temporada y fruta fresca que acompañan su frescura.',
				href: '/shop/tablas'
			},
			{
				name: 'Hogaza Brie & Romero',
				desc: 'El brie fundido y el romero piden un blanco mineral.',
				href: '/shop/hogazas'
			}
		],
		piensos: [
			{
				name: 'Tabla 4 Estaciones',
				desc: 'Su fruta roja ligera va con quesos suaves y charcutería fresca.',
				href: '/shop/tablas'
			},
			{
				name: 'Hogaza Vindima',
				desc: 'Los higos de la hogaza abrazan sus taninos suaves.',
				href: '/shop/hogazas'
			},
			{
				name: 'Picoteo',
				desc: 'Aceitunas, almendras y bocados para una copa relajada.',
				href: '/shop/tapas'
			}
		],
		postos: [
			{
				name: 'Tabla Envero',
				desc: 'Ibéricos y quesos madurados a la altura de su estructura.',
				href: '/shop/tablas'
			},
			{
				name: 'Tabla Vindima',
				desc: 'Nuestra tabla insignia para nuestra etiqueta más versátil.',
				href: '/shop/tablas'
			},
			{
				name: 'Hogaza Vindima',
				desc: 'Higos y masa madre con su fruta negra y especias.',
				href: '/shop/hogazas'
			},
			{
				name: 'Tortilla Española',
				desc: 'Clásico de la casa que pide un tinto con cuerpo.',
				href: '/shop/tapas'
			}
		],
		granreserva: [
			{
				name: 'Tabla Vindima',
				desc: 'Lo mejor de la bodega para una botella de guarda.',
				href: '/shop/tablas'
			},
			{
				name: 'Hogaza Vindima',
				desc: 'Higos, nuez y masa madre para sus taninos sedosos.',
				href: '/shop/hogazas'
			}
		]
	};

	let selectedWine = $state<WinePick>('blanc');
	const activeRecs = $derived(wineRecs[selectedWine]);

	const chipClass =
		'rounded-full border border-primary/50 bg-primary/14 px-3.5 py-2 text-[11.5px] font-medium tracking-wide text-accent no-underline transition-colors hover:bg-primary/25';
	const chipFeaturedClass =
		'rounded-full border border-primary/55 bg-primary/14 px-3.5 py-2 text-[11.5px] font-medium tracking-wide text-accent-foreground no-underline transition-colors hover:bg-primary/25';
</script>

<Section
	id="maridajes"
	contain={false}
	yPadding="none"
	surface="background"
	class="relative overflow-hidden pt-14"
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
			<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">
				De la copa a la mesa
			</p>
			<h2
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				Maridajes
			</h2>
			<p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
				Nuestros vinos de Bodegas de la Parra y con qué platillos de la casa brillan. Elige por vino
				o por platillo.
			</p>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each wines as wine (wine.name)}
				<Card
					class={cn(
						'gap-4 rounded-lg border-primary p-7',
						wine.featured ? 'bg-accent text-accent-surface-muted' : 'bg-card'
					)}
				>
					<div class="flex items-center justify-between gap-3">
						<h3
							class={cn(
								'font-display text-[27px] leading-none font-semibold tracking-[0.02em] uppercase',
								wine.featured ? 'text-accent-foreground' : 'text-accent'
							)}
						>
							{wine.name}
						</h3>
						<span
							class={cn(
								'shrink-0 rounded-sm px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.18em] uppercase',
								wine.featured
									? 'bg-primary text-primary-foreground'
									: 'bg-primary/16 text-accent'
							)}
						>
							{wine.tag}
						</span>
					</div>

					<div>
						<p
							class={cn(
								'mb-1.5 text-[9.5px] font-semibold tracking-[0.18em] uppercase',
								wine.featured ? 'text-primary' : 'text-chart-2'
							)}
						>
							Nota de cata
						</p>
						<p class={cn('text-[13px] leading-snug', wine.featured ? '' : 'text-foreground/70')}>
							{wine.note}
						</p>
					</div>

					<div class="flex items-baseline gap-3">
						<span
							class={cn(
								'text-[9.5px] font-semibold tracking-[0.18em] uppercase',
								wine.featured ? 'text-primary' : 'text-chart-2'
							)}
						>
							Servicio
						</span>
						<span
							class={cn(
								'font-display text-[21px] leading-none font-semibold',
								wine.featured ? 'text-accent-foreground' : 'text-accent'
							)}
						>
							{wine.service}
						</span>
					</div>

					<div>
						<p
							class={cn(
								'mb-2.5 text-[9.5px] font-semibold tracking-[0.18em] uppercase',
								wine.featured ? 'text-primary' : 'text-chart-2'
							)}
						>
							Marida con
						</p>
						<div class="flex flex-wrap gap-2">
							{#each wine.pairings as chip (chip.label)}
								<a
									href={resolve(chip.href as '/shop/tablas' | '/shop/hogazas' | '/shop/tapas')}
									class={wine.featured ? chipFeaturedClass : chipClass}
								>
									{chip.label}
								</a>
							{/each}
						</div>
					</div>
				</Card>
			{/each}
		</div>

		<Card
			class="mt-6 flex flex-col items-start gap-5 rounded-lg border-primary/55 bg-card px-7 py-5.5 sm:flex-row sm:items-center"
		>
			<div class="min-w-60 flex-1">
				<div class="flex flex-wrap items-baseline gap-3">
					<h3
						class="font-display text-2xl font-semibold tracking-[0.02em] text-accent uppercase"
					>
						Clericot de la casa
					</h3>
					<span
						class="rounded-sm bg-primary/16 px-2.5 py-1.5 text-[9.5px] font-semibold tracking-[0.18em] text-accent uppercase"
					>
						De la casa · 6–8 °C
					</span>
				</div>
				<p class="mt-2 max-w-xl text-[13px] leading-snug text-foreground/70">
					Vino, fruta de temporada y un toque de especias, servido muy frío.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a href={resolve('/shop/tapas')} class={chipClass}>Picoteo</a>
				<a href={resolve('/shop/tapas')} class={chipClass}>Tortilla Española</a>
			</div>
		</Card>

		<div class="mx-auto mt-17.5 max-w-205">
			<div class="mb-3.5 text-center">
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Guía rápida</p>
				<h3
					class="font-display text-3xl font-semibold tracking-[0.01em] text-accent uppercase sm:text-4xl"
				>
					¿Qué pedir con cada platillo?
				</h3>
			</div>

			{#each guide as row, i (row.dish)}
				<div
					class={cn(
						'flex items-baseline gap-3.5 py-4',
						i < guide.length - 1 && 'border-b border-accent/12'
					)}
				>
					<span
						class="font-display text-xl font-semibold tracking-[0.02em] text-accent uppercase sm:text-[21px]"
					>
						{row.dish}
						{#if row.note}
							<span class="font-sans text-xs font-normal tracking-normal text-foreground/50 normal-case">
								{row.note}
							</span>
						{/if}
					</span>
					<span
						class="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-accent/30"
						aria-hidden="true"
					></span>
					<span class="shrink-0 text-right text-sm leading-snug text-chart-2">{row.wines}</span>
				</div>
			{/each}
		</div>
	</div>

	<div class="relative mt-17.5 overflow-hidden bg-accent px-6 py-16 pb-21 sm:px-10">
		<img
			src={ASSETS_DATA.GLASS_SOFT}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute -right-5 -bottom-8 w-40 opacity-15"
			loading="lazy"
			decoding="async"
		/>
		<img
			src={ASSETS_DATA.OLIVE}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute top-12 left-8 hidden w-27.5 -rotate-12 opacity-15 sm:block"
			loading="lazy"
			decoding="async"
		/>

		<div class="relative mx-auto max-w-270 text-center">
			<p class="mb-4 text-xs font-medium tracking-widest text-primary uppercase">Te recomendamos</p>
			<h3
				class="mb-3 font-display text-3xl leading-tight font-semibold tracking-[0.01em] text-accent-foreground uppercase sm:text-4xl"
			>
				¿Qué vino vas a abrir?
			</h3>
			<p class="mx-auto mb-7.5 max-w-md text-sm leading-relaxed text-accent-surface-muted">
				Elige tu botella y te decimos qué pedir de la cocina.
			</p>

			<Tabs.Root bind:value={selectedWine} class="items-center gap-0">
				<Tabs.List
					class="h-auto flex-wrap justify-center rounded-none border border-primary bg-white/4 p-0 text-accent-foreground"
				>
					{#each winePicks as pick, i (pick.id)}
						<Tabs.Trigger
							value={pick.id}
							class={cn(
								'rounded-none border-0 px-4 py-2.5 text-sm text-accent-foreground shadow-none data-[state=active]:bg-primary/20 data-[state=active]:text-accent-foreground data-[state=active]:shadow-none',
								i < winePicks.length - 1 && 'border-r border-primary/40'
							)}
						>
							{pick.label}
						</Tabs.Trigger>
					{/each}
				</Tabs.List>
			</Tabs.Root>

			<div class="mt-9 grid grid-cols-1 gap-4.5 text-left sm:grid-cols-2 lg:grid-cols-3">
				{#each activeRecs as rec (rec.name)}
					<a
						href={resolve(rec.href as '/shop/tablas' | '/shop/hogazas' | '/shop/tapas')}
						class="flex flex-col gap-2.5 rounded-lg border border-primary bg-card px-5 py-5.5 no-underline transition-colors hover:bg-card/95"
					>
						<span
							class="font-display text-[22px] leading-tight font-semibold tracking-[0.02em] text-accent uppercase"
						>
							{rec.name}
						</span>
						<span class="text-[12.5px] leading-snug text-foreground/60">{rec.desc}</span>
						<span
							class="mt-auto pt-1.5 text-[10.5px] font-semibold tracking-[0.14em] text-chart-2 uppercase"
						>
							Ver en la tienda →
						</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</Section>
