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
			| '/shop/tablas'
			| '/shop/tapas'
			| '/shop/hogazas'
			| '/shop/bebidas'
			| '/shop/postres'
			| '/shop/bowls';
		title: () => string;
		description: () => string;
		priceRange: () => string;
		image?: { src: string; alt: () => string; class?: string };
		placeholder?: () => string;
	};

	const categories: CategoryCard[] = [
		{
			path: '/shop/tablas',
			title: () => 'Boards',
			description: () => 'Charcuterie and cheese to share',
			priceRange: () => '$650 – $2,380',
			image: {
				src: ASSETS_DATA.BOARD,
				alt: () => 'Charcuterie board',
				class: 'h-32 self-end'
			}
		},
		{
			path: '/shop/tapas',
			title: () => 'Tapas',
			description: () => 'Small bites to pair with your glass',
			priceRange: () => '$55 – $95',
			image: {
				src: ASSETS_DATA.TAPA,
				alt: () => 'Tapas',
				class: 'h-32'
			}
		},
		{
			path: '/shop/hogazas',
			title: () => 'Artisan loaves',
			description: () => 'Artisan sourdough bread',
			priceRange: () => '$120 – $260',
			image: {
				src: ASSETS_DATA.CHEESE,
				alt: () => 'Artisan loaves',
				class: 'h-32'
			}
		},
		{
			path: '/shop/bebidas',
			title: () => 'Drinks',
			description: () => 'Author wine by the glass and bottle',
			priceRange: () => '$90 – $1,200',
			image: {
				src: ASSETS_DATA.GLASS_SOFT,
				alt: () => 'Drinks',
				class: 'h-36 self-end'
			}
		},
		{
			path: '/shop/postres',
			title: () => 'Desserts',
			description: () => 'House sweets to finish',
			priceRange: () => '$80 – $160',
			placeholder: () => 'dessert\nillustration'
		},
		{
			path: '/shop/bowls',
			title: () => 'Bowls',
			description: () => 'Fresh, seasonal',
			priceRange: () => '$110 – $190',
			placeholder: () => 'bowl\nillustration'
		}
	];
</script>

<Section id="shop" yPadding="none" class="bg-secondary py-16 pb-24 sm:pb-28">
	<div class="mb-14 text-center">
		<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Explore the menu</p>

		<h2
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			From the cellar to your table
		</h2>

		<p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
			Six categories to set your table. Tap one to see the full menu and order.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
		{#each categories as category (category.path)}
			<a href={resolve(category.path)} class="group block no-underline">
				<Card
					class="h-full items-center gap-3 rounded-lg border-primary bg-card px-6 py-6 text-center shadow-brand-subtle transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-lift"
				>
					<div class="flex h-36 w-full items-center justify-center">
						{#if category.image}
							<img
								src={category.image.src}
								alt={category.image.alt()}
								class={category.image.class}
								loading="lazy"
								decoding="async"
							/>
						{:else if category.placeholder}
							<div
								class="flex size-28 shrink-0 items-center justify-center rounded-full border border-dashed border-accent/35 bg-primary/6 text-center"
							>
								<span
									class="font-mono text-xs leading-snug tracking-wider whitespace-pre-line text-accent/60"
								>
									{category.placeholder()}
								</span>
							</div>
						{/if}
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
