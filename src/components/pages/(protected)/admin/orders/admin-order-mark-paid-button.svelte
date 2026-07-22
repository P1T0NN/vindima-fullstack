<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// LUCIDE ICONS
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import StampIcon from '@lucide/svelte/icons/stamp';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import MailIcon from '@lucide/svelte/icons/mail';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const convex = useConvexClient();
	let busy = $state(false);

	const total = $derived(formatMoneyMinor(order.amounts.totalMinor, order.currency));
	const hasRewardLine = $derived(order.lines.some((line) => line.isRewardLine));
	const isGuest = $derived(order.userId === null);

	async function settle() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.orders.mutations.settleOrder.settleOrder,
				{ orderId: order._id }
			);
			toastResult(res);
		} finally {
			busy = false;
		}
	}
</script>

{#if order.status === 'pending'}
	<ActionButton
		function={settle}
		size="sm"
		isPending={busy}
		title={`¿Marcar ${order.number} como pagado?`}
		description={`Confirmas que recibiste el pago de ${total}.`}
	>
		Marcar como pagado

		{#snippet body()}
			<ul class="flex flex-col gap-2.5 text-sm">
				<li class="flex items-start gap-2.5 text-foreground">
					<CircleCheckIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>El pedido queda marcado como pagado.</span>
				</li>

				{#if !isGuest}
					<li class="flex items-start gap-2.5 text-foreground">
						<StampIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
						<span>Se otorga el sello de recompensa del cliente.</span>
					</li>
				{/if}

				{#if hasRewardLine}
					<li class="flex items-start gap-2.5 rounded-md bg-chart-2/10 px-2.5 py-2 text-chart-2">
						<GiftIcon class="mt-0.5 size-4 shrink-0" />
						<span>Se aplica el artículo de recompensa gratis de este pedido.</span>
					</li>
				{/if}

				<li class="flex items-start gap-2.5 text-foreground">
					<MailIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>Se envía el recibo al cliente y se te notifica el pedido.</span>
				</li>
			</ul>
		{/snippet}
	</ActionButton>
{/if}
