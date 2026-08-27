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

	const refundOrder = useMutation(api.tables.orders.mutations.refundOrder.refundOrder);

	let busy = $state(false);

	const hasRewardLine = $derived(order.lines.some((line) => line.isRewardLine));
	const total = $derived(formatMoneyMinor(order.amounts.totalMinor, order.currency));

	async function refund() {
		if (busy) return;
		busy = true;
		try {
			let result;
			try {
				result = await refundOrder({ orderId: order._id });
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
					<span class="mt-0.5 icon-[lucide--rotate-ccw] size-4 shrink-0 text-muted-foreground"
					></span>
					<span>El pedido queda marcado como reembolsado.</span>
				</li>

				<li class="flex items-start gap-2.5 text-foreground">
					<span class="mt-0.5 icon-[lucide--stamp] size-4 shrink-0 text-muted-foreground"></span>
					<span>Se revierte el sello de recompensa que generó este pedido.</span>
				</li>

				{#if hasRewardLine}
					<li class="flex items-start gap-2.5 rounded-md bg-chart-2/10 px-2.5 py-2 text-gold-ink">
						<span class="mt-0.5 icon-[lucide--gift] size-4 shrink-0"></span>
						<span>
							Se devuelve el artículo de recompensa gratis: el cliente puede elegir su recompensa de
							nuevo.
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
