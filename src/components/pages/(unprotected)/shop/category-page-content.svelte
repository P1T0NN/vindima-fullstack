<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';
	import CategoryProductGrid from '@/features/products/components/category-product-grid/category-product-grid.svelte';
	import CategoryPageEmpty from './empty/category-page-empty.svelte';
	import UpsellDialog from '@/features/upsells/components/upsell-dialog/upsell-dialog.svelte';

	// STATE
	import { upsells } from '@/features/upsells/classes/upsells.svelte';

	// TYPES
	import type { ShopCategoryPage } from '@/shared/features/productCategories/types/productCategoriesTypes';
	import type { UpsellCatalog } from '@/shared/features/upsells/types/upsellsTypes';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	let {
		pageData,
		upsellCatalog
	}: {
		/** Resolved on direct hits (loader awaited it — real 404s happen there); a streamed
		 *  promise on client-side navigations, suspending the parent `<svelte:boundary>`. */
		pageData: ShopCategoryPage | Promise<ShopCategoryPage | null>;
		/** Streamed upsell rules — seeds the client controller (one-shot, no subscription). */
		upsellCatalog: Promise<UpsellCatalog>;
	} = $props();

	// Seed the upsell controller once the (streamed) catalog resolves. Client-only ($effect),
	// never blocks the product render — the dialog only matters after a user taps "Agregar".
	$effect(() => {
		upsellCatalog.then((c) => upsells.setCatalog(c.rules)).catch(() => {});
	});

	// Experimental async Svelte: `$derived(await …)` — SSR waits (content lands in the
	// HTML); the first client render suspends into the boundary's pending snippet; and
	// category→category navigations re-resolve reactively (top-level `await` would freeze
	// the first value, since SvelteKit reuses this component across `[category]` params).
	const page = $derived(await pageData);

	const category = $derived(page?.category);
	const slug = $derived(page?.category.slug);
</script>

{#if !page || !category}
	<CategoryPageEmpty />
{:else}
	<SvelteHead title={category.name} description={category.description ?? undefined} />

	<Section
		contain={false}
		yPadding="none"
		class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
	>
		<!-- Background: the category's own uploaded image, floated faintly. -->
		{#if category.image}
			<img
				src={category.image}
				alt=""
				aria-hidden="true"
				class="pointer-events-none absolute top-16 -right-10 w-64 opacity-10"
				loading="lazy"
				decoding="async"
			/>
			<img
				src={category.image}
				alt=""
				aria-hidden="true"
				class="pointer-events-none absolute bottom-16 -left-10 w-52 opacity-10"
				loading="lazy"
				decoding="async"
			/>
		{/if}

		<div class="relative {PAGE_CONTAINER}">
			<Button href="{resolve('/')}#shop" class="mb-8">
				<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
				Volver a la tienda
			</Button>

			<div class="mb-12 text-center">
				<!-- Eyebrow: the category's own subtitle (set in admin). -->
				{#if category.subtitle}
					<p class="mb-4 text-xs font-medium tracking-widest text-gold-ink uppercase">
						{category.subtitle}
					</p>
				{/if}

				<h1
					class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
				>
					{category.name}
				</h1>

				{#if category.description}
					<p class="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
						{category.description}
					</p>
				{/if}
			</div>

			<CategoryProductGrid products={page.products} category={category.slug} />

			<!-- Category-specific extras (promotions / CTA), inline per slug. -->
			{#if slug === 'bowls'}
				{@render ctaPanel('Arma tu bowl para llevar.', 'Pedir por WhatsApp')}
			{:else if slug === 'hogazas'}
				{@render ctaPanel(
					'Pide tu hogaza del día: los miembros del Club ahorran 10%.',
					'Pedir por WhatsApp'
				)}
			{:else if slug === 'bebidas'}
				{@render ctaPanel(
					'¿Quieres una cata privada o botellas para tu evento?',
					'Pedir por WhatsApp'
				)}
			{/if}
		</div>
	</Section>

	<!-- Add-to-cart suggestion dialog — controlled by the shared upsells controller. -->
	<UpsellDialog />
{/if}

<!-- The WhatsApp CTA panel a few categories share — one markup, called per category above. -->
{#snippet ctaPanel(text: string, label: string)}
	<div
		class="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5 py-5"
	>
		<p class="text-sm leading-snug text-accent">{text}</p>
		<Button
			href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
			target="_blank"
			rel="noopener noreferrer"
			variant="whatsapp"
		>
			{label}
		</Button>
	</div>
{/snippet}
