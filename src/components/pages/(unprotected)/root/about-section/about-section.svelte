<script lang="ts">
	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';
	import { cn } from '@/utils/utils.js';
</script>

<Section
	id="about"
	contain={false}
	yPadding="none"
	surface="background"
	class="relative overflow-hidden"
>
	<div class="relative px-6 py-16 text-center sm:px-10 sm:py-16">
		<img
			src={ASSETS_DATA.OLIVE}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute top-9 right-12 hidden w-27.5 rotate-14 opacity-15 sm:block"
			loading="lazy"
			decoding="async"
		/>
		<img
			src={ASSETS_DATA.OLIVES}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute top-15 -left-10 hidden w-45 opacity-15 sm:block"
			loading="lazy"
			decoding="async"
		/>

		<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">La casa</p>
		<h2
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			Experiencia Vindima
		</h2>
		<p class="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
			La historia detrás de la mesa: quién la sirve, dónde nace el vino y por qué existe este lugar.
		</p>
	</div>

	<div class={cn(PAGE_CONTAINER, 'pb-20 sm:pb-24')}>
		<div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
			<img
				alt="Retrato de Alby"
				class="rounded-lg object-contain"
				decoding="async"
				src="/root/about-image.png"
			/>

			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">La anfitriona</p>
				<h3
					class="mb-5 font-display text-3xl leading-none font-semibold tracking-[0.01em] text-accent uppercase sm:text-4xl lg:text-[44px]"
				>
					Conoce a Alby
				</h3>
				<p class="mb-4 max-w-md text-[15px] leading-[1.85] text-foreground/75">
					Alby fundó Vindima con una convicción: los mejores momentos pasan alrededor de la mesa. Su
					historia con el vino empezó en casa, sirviendo a los suyos, y creció hasta convertirse en
					este espacio en Aguascalientes.
				</p>
				<p class="mb-6 max-w-md text-[15px] leading-[1.85] text-foreground/75">
					Hoy cura cada tabla, elige cada botella y recibe a cada mesa como recibe en su casa.
				</p>
				<blockquote class="border-l-2 border-primary pl-5">
					<p
						class="max-w-md font-display text-xl leading-snug text-accent italic sm:text-[22px] sm:leading-normal"
					>
						«Ser una gran anfitriona es hacer que cada persona se sienta esperada. Vindima existe
						para compartir eso: el vino, el pan y la buena mesa.»
					</p>
				</blockquote>
			</div>
		</div>
	</div>

	<div class="relative overflow-hidden bg-accent px-6 py-20 sm:px-10 sm:py-21">
		<img
			src={ASSETS_DATA.GLASS}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute -bottom-5 -left-8 w-45 opacity-15"
			loading="lazy"
			decoding="async"
		/>
		<img
			src={ASSETS_DATA.BOTTLE}
			alt=""
			aria-hidden="true"
			class="pointer-events-none absolute top-8 -right-5 w-42.5 opacity-15"
			loading="lazy"
			decoding="async"
		/>

		<div class="relative mx-auto max-w-xl text-center">
			<p class="mb-4 text-xs font-medium tracking-widest text-primary uppercase">Desde 2023</p>
			<h3
				class="mb-6 font-display text-3xl leading-tight font-semibold tracking-[0.01em] text-accent-foreground uppercase sm:text-4xl lg:text-[44px]"
			>
				La historia de Vindima
			</h3>
			<p class="mb-4 text-[15px] leading-[1.9] text-accent-surface-muted">
				Vindima nació en 2023 en el corazón de Aguascalientes con una idea simple: reunir a la gente
				alrededor de buen vino y comida hecha con las manos. Trabajamos con productores locales,
				fermentamos nuestro propio pan y curamos charcutería de temporada.
			</p>
			<p class="text-[15px] leading-[1.9] text-accent-surface-muted">
				Cada tabla, cada copa y cada tapa está pensada para grandes anfitriones — para esos momentos
				en que la mesa se vuelve el mejor lugar de la casa.
			</p>
		</div>
	</div>

	<div class={cn(PAGE_CONTAINER, 'py-20 sm:py-21')}>
		<div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">El origen</p>
				<h3
					class="mb-5 font-display text-3xl leading-tight font-semibold tracking-[0.01em] text-accent uppercase sm:text-4xl lg:text-[44px]"
				>
					El viñedo y<br />
					Bodegas de la Parra
				</h3>
				<p class="mb-4 max-w-md text-[15px] leading-[1.85] text-foreground/75">
					Nuestro vino nace a unos kilómetros de la mesa, en Bodegas de la Parra: un viñedo orgánico
					de Aguascalientes donde la uva se trabaja a mano y la vendimia — la vindima — le dio nombre
					a esta casa.
				</p>
				<p class="mb-8 max-w-md text-[15px] leading-[1.85] text-foreground/75">
					De sus barricas vienen Paradoja Blanc, Piensos, Postos y Paradoja Gran Reserva: vinos de
					autor, de producción limitada, que servimos por copa y botella.
				</p>
				<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.MARIDAJES)} variant="outline" size="lg">
					Conoce nuestros vinos →
				</Button>
			</div>

			<img
				alt="Foto del viñedo"
				class="h-110 w-full rounded-lg object-cover"
				decoding="async"
			/>
		</div>
	</div>
</Section>
