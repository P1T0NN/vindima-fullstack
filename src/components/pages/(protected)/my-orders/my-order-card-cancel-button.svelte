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

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	let { orderId, orderNumber }: { orderId: Id<'orders'>; orderNumber: string } = $props();

	const cancelMyOrder = useMutation(api.tables.orders.mutations.cancelMyOrder.cancelMyOrder);

	let busy = $state(false);

	async function cancelOrder() {
		if (busy) return;
		busy = true;
		try {
			let result;
			try {
				result = await cancelMyOrder({ orderId });
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

<ActionButton
	function={cancelOrder}
	variant="destructive"
	size="sm"
	isPending={busy}
	isDestructive
	title="¿Cancelar {orderNumber}?"
	description="El pedido se cancela y se libera cualquier recompensa que tenga reservada. No se puede deshacer."
>
	Cancelar pedido
</ActionButton>
