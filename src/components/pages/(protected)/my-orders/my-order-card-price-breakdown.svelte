<script lang="ts">
	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	let {
		totalMinor,
		currency,
		couponCode,
		couponDiscountMinor = 0
	}: {
		totalMinor: number;
		currency: string;
		couponCode?: string;
		couponDiscountMinor?: number;
	} = $props();
</script>

{#if couponDiscountMinor > 0}
	<div
		class="flex justify-between gap-3 border-t border-accent/10 px-5 py-3 text-sm text-gold-ink sm:px-6"
	>
		<span class="min-w-0 break-words">Cupón {couponCode}</span>
		<span class="shrink-0 tabular-nums">-{formatMoneyMinor(couponDiscountMinor, currency)}</span>
	</div>
{/if}

<!-- The seal. -->
<div
	class="flex items-baseline justify-between border-t border-accent/12 bg-primary/6 px-5 py-4 sm:px-6"
>
	<span class="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">Total</span>
	<span class="font-display text-[1.55rem] leading-none font-semibold text-accent tabular-nums">
		{formatMoneyMinor(totalMinor, currency)}
	</span>
</div>
