<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { CART_CONFIG } from '@/shared/config';

	// ICONS
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';

	// TYPES
	import type { CartLine } from '@/shared/features/cart/cartUtils';
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	// Product resolution is owned by the parent surface's single subscription (§5) and passed in.
	let { line, product }: { line: CartLine; product: ResolvedCartProduct } = $props();

	const available = $derived(product.unitPriceMinor !== null);
	const money = (minor: number) => formatMoneyMinor(minor, product.currency);

	function removeWithUndo() {
		const { productRef, qty } = line;
		cart.remove(productRef);
		toast('Removed from cart', {
			action: { label: 'Undo', onClick: () => cart.add(productRef, qty) }
		});
	}
</script>

<div class="flex gap-3 py-4" class:opacity-50={!available}>
	<!-- Image / placeholder -->
	<div class="size-16 shrink-0 overflow-hidden rounded-md bg-muted">
		{#if product.imageUrl}
			<img src={product.imageUrl} alt="" class="size-full object-cover" />
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 flex-col gap-1.5">
		<div class="flex items-start justify-between gap-3">
			<div class="min-w-0">
				<p class="truncate text-sm font-medium text-foreground">{product.name}</p>
				{#if available && line.qty > 1}
					<p class="mt-0.5 text-xs text-muted-foreground">
						{`${money(product.unitPriceMinor!)} each`}
					</p>
				{/if}
			</div>
			{#if available}
				<p class="shrink-0 text-sm font-semibold text-foreground tabular-nums">
					{money(product.unitPriceMinor! * line.qty)}
				</p>
			{/if}
		</div>

		<div class="mt-1 flex items-center justify-between gap-3">
			{#if available}
				<!-- Quantity stepper -->
				<div class="inline-flex items-center rounded-md border border-border">
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center text-foreground transition-opacity hover:opacity-70 disabled:opacity-30"
						onclick={() => cart.setQty(line.productRef, line.qty - 1)}
						disabled={line.qty <= 1}
						aria-label={`Decrease quantity of ${product.name}`}
					>
						<MinusIcon class="size-4" />
					</button>
					<output
						class="min-w-8 px-1 text-center text-sm font-medium tabular-nums"
						aria-live="polite"
						aria-label={`Quantity of ${product.name}`}
					>
						{line.qty}
					</output>
					<button
						type="button"
						class="inline-flex size-9 items-center justify-center text-foreground transition-opacity hover:opacity-70 disabled:opacity-30"
						onclick={() => cart.setQty(line.productRef, line.qty + 1)}
						disabled={line.qty >= CART_CONFIG.MAX_QTY_PER_LINE}
						aria-label={`Increase quantity of ${product.name}`}
					>
						<PlusIcon class="size-4" />
					</button>
				</div>
			{:else}
				<span class="text-xs font-medium text-muted-foreground">No longer available</span>
			{/if}

			<button
				type="button"
				class="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
				onclick={removeWithUndo}
			>
				Remove
			</button>
		</div>
	</div>
</div>
