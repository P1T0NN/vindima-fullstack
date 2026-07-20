<script lang="ts">
	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		product,
		money
	}: {
		product: ResolvedCartProduct;
		money: (minor: number) => string;
	} = $props();
</script>

<li class="flex items-center justify-between gap-3 py-3 text-sm">
	<span class="flex items-center gap-2">
		<span
			class="rounded-sm bg-primary px-1.5 py-0.5 text-[0.6rem] font-semibold tracking-widest text-primary-foreground uppercase"
		>
			Free
		</span>

		<span class="truncate text-foreground">{product.name}</span>
	</span>

	<span class="shrink-0 text-chart-2 tabular-nums">{money(0)}</span>
</li>
