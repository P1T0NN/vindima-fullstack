<script lang="ts">
	// CONFIG
	import { CART_CONFIG } from '@/shared/config.js';

	// CLASSES
	import { cart } from '@/features/cart/cart.svelte';
	import { upsells } from '@/features/upsells/upsells.svelte';

	// COMPONENTS
	import ProductCard from '../product-card.svelte';
	import CategoryProductGridEmpty from './category-product-grid-empty.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ShopProductRow } from '@/shared/features/products/types/productsTypes';
	import type { ShopProductVariantRow } from '@/shared/features/productVariants/types/productVariantsTypes';

	let {
		products,
		category,
		class: className
	}: {
		/** Server-loaded products for one category (see `fetchCategoryPage` — SSR, no subscription). */
		products: ShopProductRow[];
		/** The category slug these products belong to — used to match upsell rules on add. */
		category: string;
		class?: string;
	} = $props();

	// Selected variant ref per product slug (multi-variant products only).
	let selected = $state<Record<string, string>>({});

	/** The variant the card is currently selling: picked → first available → first. */
	function currentVariant(product: ShopProductRow): ShopProductVariantRow {
		const picked = product.variants.find((v) => v.ref === selected[product.slug]);
		return picked ?? product.variants.find((v) => v.available) ?? product.variants[0];
	}

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	function add(product: ShopProductRow, ref: string) {
		cart.add(ref);
		// An upsell dialog may intercept here; if it opens, it owns landing the shopper in the
		// cart on close. Otherwise open the cart now, exactly as before the feature existed.
		const shown = upsells.maybeShow({ slug: product.slug, category, name: product.name }, ref);
		if (!shown) cart.open();
	}

	const gridClass = $derived(cn('grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3', className));
</script>

{#if products.length === 0}
	<CategoryProductGridEmpty class={className} />
{:else}
	<div class={gridClass}>
		{#each products as product (product.slug)}
			{@const variant = currentVariant(product)}
			{#if product.variants.length > 1}
				<ProductCard
					title={product.name}
					description={product.description ?? undefined}
					image={product.images[0]}
					imageAlt={product.name}
					addDisabled={!variant.available}
					onadd={() => add(product, variant.ref)}
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
					price={money(variant.priceMinor)}
					addDisabled={!variant.available}
					onadd={() => add(product, variant.ref)}
				/>
			{/if}
		{/each}
	</div>
{/if}
