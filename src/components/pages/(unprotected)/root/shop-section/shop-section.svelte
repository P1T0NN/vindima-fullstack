<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from '@mmailaender/convex-svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { Card, CardDescription, CardTitle } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import ShopSectionLoading from './shop-section-loading.svelte';
	import ShopSectionEmpty from './shop-section-empty.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { ShopCategoryRow } from '@/shared/features/productCategories/types/productCategoriesTypes';

	// The homepage's single subscription. Categories are owner-managed in /admin/categories,
	// so nothing about this section is hardcoded; the query caps how many come back.
	const categoriesQuery = useQuery(
		api.tables.productCategories.queries.fetchCategoriesSafe.fetchCategoriesSafe,
		{}
	);
	const categories = $derived((categoriesQuery.data ?? []) as ShopCategoryRow[]);

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	/**
	 * Derived server-side from the category's live products, so it can never contradict a
	 * product page. Empty categories show nothing rather than a misleading "$0".
	 */
	function priceRange(category: ShopCategoryRow): string | null {
		const { minPriceMinor: min, maxPriceMinor: max } = category;
		if (min === null || max === null) return null;
		return min === max ? money(min) : `${money(min)} – ${money(max)}`;
	}

	// Category pages live at /shop/<slug>, so the slug the owner's category carries IS the route.
	const categoryHref = (category: ShopCategoryRow) => appHref(`/shop/${category.slug}`);
</script>

<Section id="shop" yPadding="none" class="bg-secondary py-16 pb-24 sm:pb-28">
	<div class="mb-14 text-center">
		<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">Explora el menú</p>

		<h2
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			De la cava a tu mesa
		</h2>

		<p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
			Toca una categoría para ver el menú completo y hacer tu pedido.
		</p>
	</div>

	{#if categoriesQuery.isLoading}
		<ShopSectionLoading />
	{:else if categories.length === 0}
		<ShopSectionEmpty />
	{:else}
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each categories as category (category._id)}
				{@const range = priceRange(category)}
				<a href={categoryHref(category)} class="group block no-underline">
					<Card
						class="h-full items-center gap-3 rounded-lg border-primary bg-card px-6 py-6 text-center shadow-brand-subtle transition-all duration-200 hover:-translate-y-1 hover:shadow-brand-lift"
					>
						<div class="flex h-36 w-full items-center justify-center">
							{#if category.image}
								<img
									src={category.image}
									alt={category.name}
									class="max-h-36 w-auto object-contain"
									loading="lazy"
									decoding="async"
								/>
							{/if}
						</div>

						<CardTitle
							class="font-display text-2xl font-semibold tracking-wide text-accent uppercase"
						>
							{category.name}
						</CardTitle>

						{#if category.description}
							<CardDescription class="text-xs leading-snug">
								{category.description}
							</CardDescription>
						{/if}

						{#if range}
							<span class="font-display text-lg font-semibold text-chart-2">{range}</span>
						{/if}
					</Card>
				</a>
			{/each}
		</div>
	{/if}
</Section>
