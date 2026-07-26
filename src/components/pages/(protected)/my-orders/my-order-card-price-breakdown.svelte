<script lang="ts">
	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	let { totalMinor, currency }: { totalMinor: number; currency: string } = $props();
</script>

<!-- The seal. -->
<div
	class="flex items-baseline justify-between border-t border-accent/12 bg-primary/6 px-5 py-4 sm:px-6"
>
	<span class="text-[0.7rem] font-semibold tracking-[0.2em] text-accent uppercase">Total</span>
	<span class="font-display text-[1.55rem] leading-none font-semibold text-accent tabular-nums">
		{formatMoneyMinor(totalMinor, currency)}
	</span>
</div>
