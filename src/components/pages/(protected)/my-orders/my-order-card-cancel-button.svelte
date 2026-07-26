<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	let { orderId, orderNumber }: { orderId: Id<'orders'>; orderNumber: string } = $props();

	const convex = useConvexClient();

	let busy = $state(false);

	async function cancelOrder() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.orders.mutations.cancelMyOrder.cancelMyOrder,
				{ orderId }
			);
			toastResult(res);
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
