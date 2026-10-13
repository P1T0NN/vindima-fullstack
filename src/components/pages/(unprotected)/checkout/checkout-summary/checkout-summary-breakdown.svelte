<script lang="ts">
	let {
		subtotalMinor,
		discountMinor,
		couponDiscountMinor = 0,
		couponCode,
		shippingMinor,
		totalMinor,
		money
	}: {
		subtotalMinor: number;
		discountMinor: number;
		couponDiscountMinor?: number;
		couponCode?: string;
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
		<div class="flex justify-between text-gold-ink">
			<span>Descuento por primer pedido</span>
			<span class="tabular-nums">-{money(discountMinor)}</span>
		</div>
	{/if}

	{#if couponDiscountMinor > 0}
		<div class="flex justify-between gap-3 text-gold-ink">
			<span class="min-w-0 break-words">Cupón {couponCode}</span>
			<span class="shrink-0 tabular-nums">-{money(couponDiscountMinor)}</span>
		</div>
	{/if}

	<div class="flex justify-between text-muted-foreground">
		<span>Envío</span>

		<span class="tabular-nums">
			{shippingMinor === 0 ? 'Gratis' : money(shippingMinor)}
		</span>
	</div>

	<div class="mt-1 flex items-baseline justify-between border-t pt-3">
		<span class="font-display text-base font-semibold tracking-wide text-accent uppercase">
			Total
		</span>

		<span class="font-display text-2xl font-semibold text-gold-ink tabular-nums">
			{money(totalMinor)}
		</span>
	</div>
</div>
