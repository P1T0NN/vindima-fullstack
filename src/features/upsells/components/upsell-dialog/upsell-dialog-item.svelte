<script lang="ts">
	// One pairing suggestion row: image (or fallback icon), name/description/price, add button.

	// CONFIG
	import { CART_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import UpsellDialogItemAddButton from './upsell-dialog-item-add-button.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatVariantName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// TYPES
	import type { UpsellCatalogItem } from '@/shared/features/upsells/types/upsellsTypes';

	// LUCIDE ICONS
	import UtensilsCrossedIcon from '@lucide/svelte/icons/utensils-crossed';

	let { item }: { item: UpsellCatalogItem } = $props();

	const price = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);
	const name = $derived(formatVariantName(item.productName, item.variantLabel));
</script>

<div class="group flex items-center gap-3.5 py-2.5">
	<div
		class="flex size-15 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary"
	>
		{#if item.imageUrl}
			<img
				src={item.imageUrl}
				alt={name}
				class="size-full object-cover"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<UtensilsCrossedIcon
				class="size-6 text-muted-foreground/60"
				strokeWidth={1.4}
				aria-hidden="true"
			/>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<p
			class="truncate font-display text-[17px] leading-tight font-semibold tracking-wide text-accent uppercase"
		>
			{name}
		</p>
		{#if item.description}
			<p class="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
				{item.description}
			</p>
		{/if}
		<p class="mt-1 font-display text-[15px] font-semibold text-gold-ink">
			{price(item.priceMinor)}
		</p>
	</div>

	<UpsellDialogItemAddButton ref={item.ref} {name} />
</div>
