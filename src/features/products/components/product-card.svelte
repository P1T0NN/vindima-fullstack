<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';

	type Props = {
		/** Product name (also drives the monogram fallback). */
		title: string;
		/** Short supporting copy. Clamped to keep every card the same height. */
		description?: string;
		/** Primary price, pre-formatted (e.g. "$120"). */
		price?: string;
		/** Small muted note next to the price (e.g. "6 bites", "per glass"). */
		priceNote?: string;
		/** Optional corner badge (e.g. "Signature"). */
		badge?: string;
		/** Optional product/category illustration shown in the square media zone. */
		image?: string;
		imageAlt?: string;
		/** Turns the whole card into a link. */
		href?: string;
		/** Add-to-cart handler. When set, the card renders an add button. */
		onadd?: () => void;
		/** Greys out the add button (e.g. sold out / not purchasable). */
		addDisabled?: boolean;
		class?: string;
		/** Extra body content under the description (e.g. an item list). */
		children?: Snippet;
		/** Replaces the default price row (e.g. dual prices, size selector, add button). */
		footer?: Snippet;
	};

	let {
		title,
		description,
		price,
		priceNote,
		badge,
		image,
		imageAlt = '',
		href,
		onadd,
		addDisabled = false,
		class: className,
		children,
		footer
	}: Props = $props();

	const monogram = $derived(title.trim().charAt(0).toUpperCase());
</script>

<svelte:element
	this={href ? 'a' : 'div'}
	{href}
	class={cn(
		'group/card relative flex flex-col overflow-hidden rounded-xl border border-primary bg-card text-left no-underline shadow-brand-subtle transition-all duration-200',
		href && 'hover:-translate-y-1 hover:shadow-brand-lift focus-visible:-translate-y-1',
		className
	)}
>
	<!-- Media zone — fixed square; image never grows the card -->
	<div class="relative aspect-square shrink-0 overflow-hidden bg-muted">
		{#if badge}
			<span
				class="absolute top-3 right-3 z-10 rounded-sm bg-primary px-2 py-1 text-[0.65rem] font-semibold tracking-widest text-primary-foreground uppercase"
			>
				{badge}
			</span>
		{/if}

		{#if image}
			<img
				src={image}
				alt={imageAlt}
				class="absolute inset-0 size-full object-cover transition-transform duration-200 group-hover/card:scale-105"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<span
				aria-hidden="true"
				class="absolute inset-0 flex items-center justify-center font-display text-6xl font-semibold text-primary/25 select-none"
			>
				{monogram}
			</span>
		{/if}
	</div>

	<!-- Body -->
	<div class="flex flex-1 flex-col gap-2 p-4 sm:p-5">
		<h3
			class="font-display text-lg leading-tight font-semibold tracking-wide text-accent uppercase"
		>
			{title}
		</h3>

		{#if description}
			<p class="text-xs leading-snug text-muted-foreground">
				{description}
			</p>
		{/if}

		{#if children}
			{@render children()}
		{/if}

		<!-- Footer pinned to the bottom so every card aligns -->
		<div class="mt-auto flex flex-col gap-3 pt-3">
			{#if footer}
				{@render footer()}
			{:else if price}
				<div class="flex items-baseline gap-2">
					<span class="font-display text-2xl leading-none font-semibold text-chart-2">
						{price}
					</span>
					{#if priceNote}
						<span class="text-xs text-muted-foreground">{priceNote}</span>
					{/if}
				</div>
			{/if}

			{#if onadd}
				<Button
					class="h-10 w-full justify-center gap-2 text-xs tracking-wider uppercase"
					disabled={addDisabled}
					onclick={onadd}
				>
					<ShoppingBagIcon class="size-4" />
					Agregar al carrito
				</Button>
			{/if}
		</div>
	</div>
</svelte:element>
