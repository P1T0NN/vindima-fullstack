<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { ASSETS_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
</script>

<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden border-b border-border bg-background"
>
	<div class="mx-auto w-full max-w-7xl px-6 py-10 sm:px-10 sm:pb-11">
		<div
			class="relative flex min-h-hero items-center border border-primary/60 px-6 py-12 sm:min-h-hero-lg sm:px-14 sm:py-16 lg:px-14"
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

			<div class="relative z-10 max-w-xl">
				<div class="mb-6 flex items-center gap-3.5">
					<span class="h-px w-12 bg-primary" aria-hidden="true"></span>
					<p class="font-display text-lg text-chart-2 italic">For great hosts · Since 2023</p>
				</div>

				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl lg:text-6xl xl:text-7xl"
				>
					Author wine.<br />
					Charcuterie.<br />
					Experiences.
				</h1>

				<p class="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground sm:mt-7">
					An organic winery in Aguascalientes. Seasonal boards, tapas and curated wine to bring your
					people together around the table.
				</p>

				<div class="mt-8 flex flex-wrap gap-3.5 sm:mt-9">
					<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.SHOP)}>Go to shop</Button>

					<Button href={appHref(UNPROTECTED_PAGE_ENDPOINTS.SHOP)} variant="ghost">View menu</Button>
				</div>
			</div>

			<img
				src={ASSETS_DATA.BOTTLE}
				alt="Vindima wine bottle"
				class="pointer-events-none absolute right-2 -bottom-11 z-10 hidden h-72 drop-shadow-brand-lg lg:block xl:right-8 xl:h-auto xl:max-h-144"
				width="280"
				height="566"
				loading="eager"
				decoding="async"
			/>
			<img
				src={ASSETS_DATA.GLASS}
				alt="Wine glass"
				class="pointer-events-none absolute right-44 -bottom-8 z-1 hidden h-48 -rotate-3 drop-shadow-brand-md lg:block xl:right-60 xl:h-72"
				width="150"
				height="300"
				loading="eager"
				decoding="async"
			/>
		</div>
	</div>
</Section>
