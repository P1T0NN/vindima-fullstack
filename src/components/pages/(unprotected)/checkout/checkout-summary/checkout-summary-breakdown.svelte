<script lang="ts">
	let {
		subtotalMinor,
		discountMinor,
		shippingMinor,
		totalMinor,
		money
	}: {
		subtotalMinor: number;
		discountMinor: number;
		shippingMinor: number;
		totalMinor: number;
		money: (minor: number) => string;
	} = $props();
</script>

<div class="flex flex-col gap-1.5 border-t pt-4 text-sm">
	<div class="flex justify-between text-muted-foreground">
		<span>Subtotal</span>
		<span class="tabular-nums">{money(subtotalMinor)}</span>
	</div>

	{#if discountMinor > 0}
		<div class="flex justify-between text-chart-2">
			<span>First-order discount</span>
			<span class="tabular-nums">−{money(discountMinor)}</span>
		</div>
	{/if}

	<div class="flex justify-between text-muted-foreground">
		<span>Shipping</span>

		<span class="tabular-nums">
			{shippingMinor === 0 ? 'Free' : money(shippingMinor)}
		</span>
	</div>

	<div class="mt-1 flex items-baseline justify-between border-t pt-3">
		<span class="font-display text-base font-semibold tracking-wide text-accent uppercase">
			Total
		</span>

		<span class="font-display text-2xl font-semibold text-chart-2 tabular-nums">
			{money(totalMinor)}
		</span>
	</div>
</div>
