<script lang="ts">
	// LIBRARIES
	import { useQuery } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { CART_CONFIG, PAGINATION_DATA } from '@/shared/config.js';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';

	// COMPONENTS
	import ProductCard from '../product-card.svelte';
	import CategoryProductGridLoading from './category-product-grid-loading.svelte';
	import CategoryProductGridEmpty from './category-product-grid-empty.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	type ShopProduct = FunctionReturnType<
		typeof api.tables.products.queries.fetchProductsByCategory.fetchProductsByCategory
	>['page'][number];

	let {
		category,
		featuredBadge,
		addLabel = 'Add to Cart',
		class: className
	}: {
		/** DB product category to list (`status: 'active'` only, server-sorted). */
		category: string;
		/** Badge shown on `featured` products (e.g. "Signature"). Omit to show none. */
		featuredBadge?: string;
		addLabel?: string;
		class?: string;
	} = $props();

	const products = useQuery(
		api.tables.products.queries.fetchProductsByCategory.fetchProductsByCategory,
		() => ({
			category,
			paginationOpts: { numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE, cursor: null }
		})
	);

	const productRows = $derived(products.data?.page ?? []);

	// Selected variant ref per product slug (multi-variant products only).
	let selected = $state<Record<string, string>>({});

	type ShopVariant = ShopProduct['variants'][number];

	/** The variant the card is currently selling: picked → first available → first. */
	function currentVariant(product: ShopProduct): ShopVariant {
		const picked = product.variants.find((v: ShopVariant) => v.ref === selected[product.slug]);
		return picked ?? product.variants.find((v: ShopVariant) => v.available) ?? product.variants[0];
	}

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	function add(ref: string) {
		cart.add(ref);
		cart.open();
	}

	const gridClass = $derived(cn('grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3', className));
</script>

{#if products.isLoading}
	<CategoryProductGridLoading class={className} />
{:else if productRows.length === 0}
	<CategoryProductGridEmpty class={className} />
{:else}
	<div class={gridClass}>
		{#each productRows as product (product.slug)}
			{@const variant = currentVariant(product)}
			{#if product.variants.length > 1}
				<ProductCard
					title={product.name}
					description={product.description ?? undefined}
					image={product.images[0]}
					imageAlt={product.name}
					badge={product.featured ? featuredBadge : undefined}
					{addLabel}
					addDisabled={!variant.available}
					onadd={() => add(variant.ref)}
				>
					{#snippet footer()}
						<div class="flex flex-col gap-3">
							<!-- Variant selector (size / format) -->
							<div
								class="grid overflow-hidden rounded-md border border-primary"
								style:grid-template-columns={`repeat(${product.variants.length}, 1fr)`}
								role="radiogroup"
								aria-label={product.name}
							>
								{#each product.variants as option (option.ref)}
									{@const inputId = `${product.slug}-variant-${option.ref}`}
									<input
										id={inputId}
										type="radio"
										name={`${product.slug}-variant`}
										value={option.ref}
										checked={variant.ref === option.ref}
										disabled={!option.available}
										class="sr-only"
										onchange={() => (selected[product.slug] = option.ref)}
									/>
									<label
										for={inputId}
										class={cn(
											'cursor-pointer border-r border-primary/40 py-2 text-center text-xs font-semibold tracking-wide uppercase transition-colors last:border-r-0',
											variant.ref === option.ref
												? 'bg-accent text-accent-foreground'
												: 'text-accent hover:bg-primary/10',
											!option.available && 'cursor-not-allowed opacity-40'
										)}
									>
										{option.label ?? option.ref}
									</label>
								{/each}
							</div>

							<span class="font-display text-2xl leading-none font-semibold text-chart-2">
								{money(variant.priceMinor)}
							</span>
						</div>
					{/snippet}
				</ProductCard>
			{:else}
				<ProductCard
					title={product.name}
					description={product.description ?? undefined}
					image={product.images[0]}
					imageAlt={product.name}
					badge={product.featured ? featuredBadge : undefined}
					price={money(variant.priceMinor)}
					{addLabel}
					addDisabled={!variant.available}
					onadd={() => add(variant.ref)}
				/>
			{/if}
		{/each}
	</div>
{/if}
