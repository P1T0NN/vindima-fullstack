<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA, COMPANY_DATA } from '@/shared/config.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';
</script>

<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-accent py-14 pb-24 sm:py-16 sm:pb-28"
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
		<a
			href="{resolve('/')}#shop"
			class="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-primary uppercase no-underline transition-colors hover:text-accent-foreground"
		>
			← Back to shop
		</a>

		<div class="mb-8 flex flex-wrap items-center gap-7">
			<img
				src={ASSETS_DATA.GLASS}
				alt="Drinks"
				class="h-32 shrink-0"
				loading="lazy"
				decoding="async"
			/>
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-primary uppercase">Author wine</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-background uppercase sm:text-5xl"
				>
					Drinks
				</h1>
				<p class="mt-3.5 max-w-md text-sm leading-relaxed text-accent-surface-muted">
					Cellar selection by the glass and bottle. Ask about today's pairing.
				</p>
			</div>
		</div>

		<CategoryProductGrid category="drinks" />

		<div
			class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/35 bg-primary/10 px-5 py-5"
		>
			<p class="text-sm leading-snug text-background">
				Want a private tasting or bottles for your event?
			</p>
			<Button
				href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
				target="_blank"
				rel="noopener noreferrer"
				variant="whatsapp"
				class="h-auto px-6 py-4 text-xs tracking-wider uppercase"
			>
				Order via WhatsApp
			</Button>
		</div>
	</div>
</Section>
