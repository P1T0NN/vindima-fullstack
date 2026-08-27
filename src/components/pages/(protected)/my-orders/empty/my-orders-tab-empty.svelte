<script lang="ts">
	// TYPES
	import type { MyOrdersStatusFilter } from '@/shared/features/orders/types/ordersTypes';

	let { tab }: { tab: MyOrdersStatusFilter } = $props();

	// Each tab's emptiness means something different — "nada por pagar" is good news, so the
	// copy says so instead of apologizing for a blank list.
	const CONTENT: Record<MyOrdersStatusFilter, { icon: string; title: string; description: string }> = {
		pending: {
			icon: 'icon-[lucide--credit-card]',
			title: 'Nada pendiente de pago',
			description:
				'Todos tus pedidos están al corriente. Si un pago queda a medias, aparecerá aquí para retomarlo.'
		},
		paid: {
			icon: 'icon-[lucide--wine]',
			title: 'Aún no tienes pedidos pagados',
			description: 'Cuando completes una compra, aquí vivirá su seguimiento de principio a fin.'
		},
		closed: {
			icon: 'icon-[lucide--archive]',
			title: 'Ningún pedido cancelado',
			description: 'Buena señal: todo lo que has pedido sigue su curso.'
		}
	};

	const content = $derived(CONTENT[tab]);
</script>

<!-- Quieter sibling of MyOrdersEmpty: same medallion language, scaled down — an empty filter
     is a state, not an event. -->
<div class="flex flex-col items-center px-4 py-14 text-center sm:py-16">
	<div class="relative mb-6 flex size-24 items-center justify-center">
		<span class="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true"></span>
		<span class="absolute inset-4 rounded-full bg-primary/10" aria-hidden="true"></span>
		<span
			class="relative flex size-13 items-center justify-center rounded-full border border-primary/30 bg-card shadow-brand-subtle"
		>
			<span class={content.icon + ' size-5.5 text-accent'} aria-hidden="true"></span>
		</span>
	</div>

	<h3 class="mb-2.5 font-display text-2xl font-semibold tracking-wide text-accent">
		{content.title}
	</h3>
	<p class="max-w-xs text-sm leading-relaxed text-muted-foreground">{content.description}</p>
</div>
