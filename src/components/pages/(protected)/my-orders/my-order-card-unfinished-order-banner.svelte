<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { CHECKOUT_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import MyOrderCardCancelButton from './my-order-card-cancel-button.svelte';

	// LUCIDE ICONS
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	// Resume link — the pay page mints a fresh Stripe session for this order's CURRENT amounts,
	// so it stays valid until the expiry cron cancels the order.
	const payHref = $derived(`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_PAY}?order=${order._id}`);
</script>

<!-- The only state that asks something of the shopper, so it gets the loudest band and the
     two actions that resolve it. -->
<div
	class="mx-5 mb-5 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 sm:mx-6 dark:border-amber-900/50 dark:bg-amber-950/30"
>
	<div class="flex gap-2.5">
		<TriangleAlertIcon
			class="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
			strokeWidth={1.8}
		/>
		<p class="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
			Tu pago no se completó. Guardamos este pedido por {CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS_ONLINE}&nbsp;horas.
			Puedes terminarlo cuando quieras.
		</p>
	</div>
	<div class="mt-4 flex flex-wrap gap-2.5">
		<Button href={payHref} size="sm">Completar pago</Button>
		<MyOrderCardCancelButton orderId={order._id} orderNumber={order.number} />
	</div>
</div>
