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
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import StampIcon from '@lucide/svelte/icons/stamp';
	import GiftIcon from '@lucide/svelte/icons/gift';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const convex = useConvexClient();

	let busy = $state(false);

	const hasRewardLine = $derived(order.lines.some((line) => line.isRewardLine));
	const total = $derived(formatMoneyMinor(order.amounts.totalMinor, order.currency));

	async function refund() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(convex, api.tables.orders.mutations.refundOrder.refundOrder, {
				orderId: order._id
			});
			toastResult(res);
		} finally {
			busy = false;
		}
	}
</script>

{#if order.status === 'paid'}
	<ActionButton
		function={refund}
		variant="destructive"
		size="sm"
		isDestructive
		isPending={busy}
		title={`¿Reembolsar ${order.number}?`}
		description={`Vas a reembolsar ${total}. Esto no se puede deshacer.`}
	>
		Reembolsar

		{#snippet body()}
			<ul class="flex flex-col gap-2.5 text-sm">
				<li class="flex items-start gap-2.5 text-foreground">
					<RotateCcwIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>El pedido queda marcado como reembolsado.</span>
				</li>

				<li class="flex items-start gap-2.5 text-foreground">
					<StampIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
					<span>Se revierte el sello de recompensa que generó este pedido.</span>
				</li>

				{#if hasRewardLine}
					<li class="flex items-start gap-2.5 rounded-md bg-chart-2/10 px-2.5 py-2 text-chart-2">
						<GiftIcon class="mt-0.5 size-4 shrink-0" />
						<span>
							Se devuelve el artículo de recompensa gratis — el cliente puede elegir su
							recompensa de nuevo.
						</span>
					</li>
				{/if}
			</ul>
			
			<p class="mt-3 text-xs text-muted-foreground">
				El descuento de bienvenida nunca se restaura con un reembolso.
			</p>
		{/snippet}
	</ActionButton>
{/if}
