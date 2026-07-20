<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { ASSETS_DATA } from '@/shared/config.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';
</script>

<Section
	yPadding="none"
	contain={false}
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<img
		src={ASSETS_DATA.BOARD}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-32 -right-24 w-80 opacity-10"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative {PAGE_CONTAINER}">
		<a
			href="{resolve('/')}#shop"
			class="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
		>
			← Back to shop
		</a>

		<div class="mb-12 flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">
					Shop · To share
				</p>
				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
				>
					Charcuterie boards
				</h1>
			</div>
			<p class="max-w-sm text-sm leading-relaxed text-muted-foreground">
				Choose a size — small, medium or large. Club members save 10% on every board.
			</p>
		</div>

		<CategoryProductGrid
			category="boards"
			featuredBadge="Signature"
			class="grid-cols-1 gap-4 sm:grid-cols-2"
		/>
	</div>
</Section>
