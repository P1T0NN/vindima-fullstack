<script lang="ts">
	// DATA
	import { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';

	// UTILS
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let {
		order,
		status
	}: { order: Doc<'orders'>; status: keyof typeof ORDER_STATUS_STYLES } = $props();

	const itemCount = $derived(order.lines.reduce((n, line) => n + line.qty, 0));
	const deliveryLabel = $derived(
		order.delivery.kind === 'pickup' ? 'Recoger en tienda' : 'Entrega a domicilio'
	);
</script>

<!-- Masthead: identity left, state right. -->
<div class="flex items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
	<div class="min-w-0">
		<p
			class="font-display text-[1.45rem] leading-none font-semibold tracking-wide text-accent sm:text-[1.7rem]"
		>
			{order.number}
		</p>
		<p class="mt-2 text-xs tracking-wide text-muted-foreground">
			{formatOrderDate(order._creationTime)} - {itemCount} artículo{itemCount === 1 ? '' : 's'} -
			{deliveryLabel}
		</p>
	</div>
	<span
		class="mt-0.5 inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[0.7rem] font-medium tracking-wide {ORDER_STATUS_STYLES[
			status
		].class}"
	>
		{ORDER_STATUS_STYLES[status].label}
	</span>
</div>
