<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const settleOrder = useMutation(api.tables.orders.mutations.settleOrder.settleOrder);
	let busy = $state(false);

	const total = $derived(formatMoneyMinor(order.amounts.totalMinor, order.currency));
	const hasRewardLine = $derived(order.lines.some((line) => line.isRewardLine));
	const isGuest = $derived(order.userId === null);

	async function settle() {
		if (busy) return;
		busy = true;
		try {
			let result;
			try {
				result = await settleOrder({ orderId: order._id });
			} catch (error) {
				if (error instanceof ConvexError && hasErrorMessage(error.data)) {
					toastMessage({
						type: 'error',
						error,
						message: error.data.message
					});
				} else if (isRateLimitError(error)) {
					toastMessage({ type: 'error', error, message: '' });
				} else {
					throw error;
				}
				return;
			}
			const message = result.message;
			if (!result.success) {
				toastMessage({ type: 'error', error: null, message });
				return;
			}
			toastMessage({ type: 'success', message });
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
					<span class="mt-0.5 icon-[lucide--circle-check] size-4 shrink-0 text-muted-foreground"
					></span>
					<span>El pedido queda marcado como pagado.</span>
				</li>

				{#if !isGuest}
					<li class="flex items-start gap-2.5 text-foreground">
						<span class="mt-0.5 icon-[lucide--stamp] size-4 shrink-0 text-muted-foreground"></span>
						<span>Se otorga el sello de recompensa del cliente.</span>
					</li>
				{/if}

				{#if hasRewardLine}
					<li class="flex items-start gap-2.5 rounded-md bg-chart-2/10 px-2.5 py-2 text-gold-ink">
						<span class="mt-0.5 icon-[lucide--gift] size-4 shrink-0"></span>
						<span>Se aplica el artículo de recompensa gratis de este pedido.</span>
					</li>
				{/if}

				<li class="flex items-start gap-2.5 text-foreground">
					<span class="mt-0.5 icon-[lucide--mail] size-4 shrink-0 text-muted-foreground"></span>
					<span>Se envía el recibo al cliente y se te notifica el pedido.</span>
				</li>
			</ul>
		{/snippet}
	</ActionButton>
{/if}
