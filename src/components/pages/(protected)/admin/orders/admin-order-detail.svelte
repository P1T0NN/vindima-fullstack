<script lang="ts">
	// LIBRARIES
	import { resolve } from '$app/paths';

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import AdminOrderMarkPaidButton from './admin-order-mark-paid-button.svelte';
	import AdminOrderFulfillment from './admin-order-fulfillment.svelte';
	import AdminOrderRefundButton from './admin-order-refund-button.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { order }: { order: Doc<'orders'> } = $props();

	const money = (minor: number) => formatMoneyMinor(minor, order.currency);

	const STATUS_LABELS: Record<Doc<'orders'>['status'], string> = {
		pending: 'Pendiente',
		paid: 'Pagado',
		cancelled: 'Cancelado',
		refunded: 'Reembolsado'
	};
	const STATUS_CLASSES: Record<Doc<'orders'>['status'], string> = {
		paid: 'bg-chart-2/15 text-chart-2',
		pending: 'bg-muted text-muted-foreground',
		cancelled: 'bg-destructive/10 text-destructive',
		refunded: 'bg-destructive/10 text-destructive'
	};

	const itemCount = $derived(order.lines.reduce((n, line) => n + line.qty, 0));
	const hasWelcome = $derived(order.amounts.welcomeDiscountMinor > 0);

	const shippingLabel = $derived(
		order.delivery.kind === 'pickup'
			? 'Recoger en tienda'
			: order.amounts.shippingMinor === 0
				? 'Gratis'
				: money(order.amounts.shippingMinor)
	);

	// Any state-changing action available? (drives whether the actions card renders.)
	const hasActions = $derived(order.status === 'pending' || order.status === 'paid');
</script>

<div class="flex flex-col gap-6">
	<!-- Header: back + number + status. -->
	<div class="flex flex-col gap-4">
		<Button href={resolve('/admin/orders')} variant="ghost" size="sm" class="w-fit">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Pedidos
		</Button>

		<div class="flex flex-wrap items-center justify-between gap-3">
			<div>
				<h1 class="text-2xl font-semibold tracking-tight">{order.number}</h1>
				<p class="mt-1 text-sm text-muted-foreground">
					{formatOrderDate(order._creationTime)} · {itemCount} artículo{itemCount === 1 ? '' : 's'}
				</p>
			</div>
			<span
				class={`inline-flex rounded-sm px-2.5 py-1 text-sm font-medium ${STATUS_CLASSES[order.status]}`}
			>
				{STATUS_LABELS[order.status]}
			</span>
		</div>
	</div>

	<!-- Actions: mark paid (pending) · fulfillment + refund (paid). -->
	{#if hasActions}
		<Card class="flex flex-col gap-4 p-5">
			<h2 class="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Acciones</h2>

			{#if order.status === 'pending'}
				<AdminOrderMarkPaidButton {order} />
			{:else if order.status === 'paid'}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Entrega</span>
						<AdminOrderFulfillment {order} />
					</div>
					<div class="flex flex-col gap-2 border-t pt-4">
						<span class="text-xs tracking-wide text-muted-foreground uppercase">Reembolso</span>
						<AdminOrderRefundButton {order} />
					</div>
				</div>
			{/if}
		</Card>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Items + totals. -->
		<Card class="flex flex-col p-5 lg:col-span-2">
			<h2 class="mb-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
				Artículos
			</h2>
			<ul class="flex flex-col divide-y">
				{#each order.lines as line, i (i)}
					<li class="flex items-baseline justify-between gap-4 py-2.5 text-sm">
						<span class="min-w-0">
							{line.name}{#if line.qty > 1}<span class="text-muted-foreground"> × {line.qty}</span
								>{/if}
						</span>
						<span class={`shrink-0 tabular-nums ${line.isRewardLine ? 'text-chart-2 italic' : ''}`}>
							{line.isRewardLine ? 'Gratis' : money(line.unitPriceMinor * line.qty)}
						</span>
					</li>
				{/each}
			</ul>

			<dl class="mt-4 flex flex-col gap-1.5 border-t pt-4 text-sm">
				<div class="flex justify-between text-muted-foreground">
					<dt>Subtotal</dt>
					<dd class="tabular-nums">{money(order.amounts.subtotalMinor)}</dd>
				</div>
				{#if hasWelcome}
					<div class="flex justify-between text-muted-foreground">
						<dt>Oferta de bienvenida</dt>
						<dd class="tabular-nums">−{money(order.amounts.welcomeDiscountMinor)}</dd>
					</div>
				{/if}
				<div class="flex justify-between text-muted-foreground">
					<dt>Envío</dt>
					<dd class="tabular-nums">{shippingLabel}</dd>
				</div>
				<div class="mt-1.5 flex justify-between border-t pt-2.5 text-base font-semibold">
					<dt>Total</dt>
					<dd class="tabular-nums">{money(order.amounts.totalMinor)}</dd>
				</div>
			</dl>
		</Card>

		<!-- Customer + delivery + note. -->
		<div class="flex flex-col gap-6">
			<Card class="flex flex-col gap-2 p-5">
				<h2 class="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
					Cliente
				</h2>
				<p class="text-sm font-medium">{order.name || '—'}</p>
				<a href={`mailto:${order.email}`} class="text-sm text-accent break-all hover:underline">
					{order.email}
				</a>
				{#if order.phone}
					<p class="text-sm text-muted-foreground">{order.phone}</p>
				{/if}
				{#if order.userId === null}
					<span class="mt-1 w-fit rounded-sm bg-muted px-2 py-0.5 text-xs text-muted-foreground">
						Invitado
					</span>
				{/if}
			</Card>

			<Card class="flex flex-col gap-2 p-5">
				<h2 class="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
					Entrega
				</h2>
				{#if order.delivery.kind === 'pickup'}
					<p class="text-sm font-medium">Recoger en tienda</p>
				{:else}
					<p class="text-sm leading-relaxed">
						{order.delivery.address.line1}<br />
						{#if order.delivery.address.line2}{order.delivery.address.line2}<br />{/if}
						{order.delivery.address.postcode}
						{order.delivery.address.city}<br />
						{order.delivery.address.country}
					</p>
				{/if}
			</Card>

			{#if order.note}
				<Card class="flex flex-col gap-2 p-5">
					<h2 class="mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
						Nota
					</h2>
					<p class="text-sm leading-relaxed text-foreground/90">{order.note}</p>
				</Card>
			{/if}
		</div>
	</div>
</div>
