<script lang="ts">
	// TYPES
	import type { CartLine } from '@/shared/features/cart/cartUtils';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		line,
		product,
		unavailableRefs = [],
		money
	}: {
		line: CartLine;
		product: ResolvedCartProduct;
		unavailableRefs?: string[];
		money: (minor: number) => string;
	} = $props();

	const unavailable = $derived(
		product.unitPriceMinor === null || unavailableRefs.includes(line.productRef)
	);
</script>

<li class="flex items-start justify-between gap-3 py-3 text-sm {unavailable ? 'opacity-50' : ''}">
	<span class="min-w-0">
		<span class="block truncate text-foreground">{product.name}</span>
		<span class="text-xs text-muted-foreground">
			{unavailable ? 'No longer available' : `${line.qty} × ${money(product.unitPriceMinor ?? 0)}`}
		</span>
	</span>
	{#if !unavailable}
		<span class="shrink-0 text-foreground tabular-nums">
			{money((product.unitPriceMinor ?? 0) * line.qty)}
		</span>
	{/if}
</li>
