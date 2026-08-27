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
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const setOrderFulfillment = useMutation(
		api.tables.orders.mutations.setOrderFulfillment.setOrderFulfillment
	);

	// Fulfillment moves processing → shipped → delivered (same track the customer rail shows).
	const STEPS = [
		{ key: 'processing', label: 'En proceso' },
		{ key: 'shipped', label: 'Enviado' },
		{ key: 'delivered', label: 'Entregado' }
	] as const;
	type Stage = (typeof STEPS)[number]['key'];

	let busy = $state<Stage | null>(null);

	async function setStage(stage: Stage) {
		if (busy) return;
		busy = stage;
		try {
			let result;
			try {
				result = await setOrderFulfillment({ orderId: order._id, fulfillment: stage });
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
			busy = null;
		}
	}
</script>

{#if order.status === 'paid'}
	<div class="flex flex-wrap items-center gap-2">
		{#each STEPS as step (step.key)}
			{#if order.fulfillment === step.key}
				<span
					class="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground"
				>
					<span class="icon-[lucide--check] size-4"></span>
					{step.label}
				</span>
			{:else}
				<ActionButton
					function={() => setStage(step.key)}
					variant="outline"
					isPending={busy === step.key}
					title={`¿Marcar como ${step.label.toLowerCase()}?`}
					description={step.key === 'shipped'
						? 'Se marca como enviado y se le notifica al cliente por correo.'
						: `Se actualiza el estado de entrega a "${step.label.toLowerCase()}".`}
				>
					{step.label}
				</ActionButton>
			{/if}
		{/each}
	</div>
{/if}
