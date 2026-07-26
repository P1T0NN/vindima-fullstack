<script lang="ts">
	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { PurchaseHistoryRow } from '../accountClubCardTypes';

	let { order }: { order: PurchaseHistoryRow } = $props();
</script>

<div
	role="row"
	class="grid grid-cols-1 gap-y-0.5 border-t border-accent/10 py-3 sm:grid-cols-3 sm:gap-y-0"
>
	<span role="cell" class="text-muted-foreground">{order.date}</span>
	<span role="cell" class="line-clamp-2 text-foreground">{order.description}</span>
	<span
		role="cell"
		class="font-display text-lg font-semibold text-gold-ink tabular-nums sm:text-right"
	>
		{formatMoneyMinor(order.totalMinor, order.currency)}
	</span>
</div>
