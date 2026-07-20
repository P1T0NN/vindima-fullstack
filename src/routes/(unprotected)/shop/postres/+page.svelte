<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';
</script>

<Section
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<a
		href="{resolve('/')}#shop"
		class="mb-8 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
	>
		← Back to shop
	</a>

	<div class="mb-8 flex flex-wrap items-center gap-7">
		<div
			class="flex size-28 shrink-0 items-center justify-center rounded-full border border-dashed border-accent/35 bg-primary/6 text-center"
		>
			<span
				class="font-mono text-xs leading-snug tracking-wider whitespace-pre-line text-accent/60"
			>
				dessert illustration
			</span>
		</div>
		<div>
			<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">To finish</p>
			<h1
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				Desserts
			</h1>
			<p class="mt-3.5 max-w-md text-sm leading-relaxed text-muted-foreground">
				House sweets, made in portions to share at the end of the meal.
			</p>
		</div>
	</div>

	<CategoryProductGrid category="desserts" />

	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5 py-5"
	>
		<p class="text-sm leading-snug text-accent">Order your dessert to go or for your table.</p>
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
</Section>
