<script lang="ts">
	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		line,
		product,
		currency
	}: {
		line: Doc<'orders'>['lines'][number];
		/** Live catalog row for this line's ref, if it still resolves. */
		product: ResolvedCartProduct | undefined;
		currency: string;
	} = $props();

	const money = (minor: number) => formatMoneyMinor(minor, currency);

	/** Live catalog name when the ref still resolves; the frozen snapshot otherwise. */
	const name = $derived(
		product && product.productName
			? resolvedDisplayName({ ...product, ref: line.productRef })
			: line.name
	);
</script>

<li class="flex items-center gap-4 px-5 py-3.5 sm:px-6">
	<div
		class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/10 bg-secondary"
	>
		{#if product?.imageUrl}
			<img
				src={product.imageUrl}
				alt=""
				loading="lazy"
				decoding="async"
				class="size-full object-cover"
			/>
		{:else}
			<span class="icon-[lucide--package] size-5 text-muted-foreground/40" ></span>
		{/if}
	</div>

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm text-foreground">{name}</p>
		<p class="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
			{#if line.isRewardLine}
				<span class="icon-[lucide--sparkles] size-3 text-gold-ink" ></span>
				<span class="text-gold-ink">Recompensa</span>
			{:else}
				{line.qty} x {money(line.unitPriceMinor)}
			{/if}
		</p>
	</div>

	<span
		class="shrink-0 font-display text-sm tabular-nums {line.isRewardLine
			? 'text-gold-ink italic'
			: 'text-foreground'}"
	>
		{line.isRewardLine ? 'Gratis' : money(line.unitPriceMinor * line.qty)}
	</span>
</li>
