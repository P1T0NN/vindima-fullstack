<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const convex = useConvexClient();

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
			const res = await safeMutation(
				convex,
				api.tables.orders.mutations.setOrderFulfillment.setOrderFulfillment,
				{ orderId: order._id, fulfillment: stage }
			);
			toastResult(res);
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
					<CheckIcon class="size-4" strokeWidth={2.2} />
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
