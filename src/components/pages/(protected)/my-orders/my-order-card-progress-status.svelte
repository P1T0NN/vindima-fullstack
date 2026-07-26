<script lang="ts">
	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';

	// TYPES
	import type { ORDER_STATUS_STYLES } from '@/features/orders/data/ordersData.js';

	let { status }: { status: keyof typeof ORDER_STATUS_STYLES } = $props();

	// Fulfillment moves processing → shipped → delivered. Only meaningful once money landed —
	// the parent gates rendering on that; this component just draws the rail.
	const STEPS = [
		{ key: 'processing', label: 'En proceso' },
		{ key: 'shipped', label: 'Enviado' },
		{ key: 'delivered', label: 'Entregado' }
	] as const;
	const currentStep = $derived(STEPS.findIndex((s) => s.key === status));
	const fillPct = $derived((Math.max(currentStep, 0) / (STEPS.length - 1)) * 100);
</script>

<div class="relative mx-5 mt-1 mb-6 sm:mx-6">
	<div class="pointer-events-none absolute top-3.5 right-3.5 left-3.5" aria-hidden="true">
		<div class="h-px w-full bg-border"></div>
		<!-- Full-width bar scaled via transform: animating `width` re-layouts every frame. -->
		<div
			class="absolute top-0 left-0 h-px w-full origin-left bg-primary transition-transform duration-500 ease-out"
			style="transform: scaleX({fillPct / 100})"
		></div>
	</div>
	<ol class="relative flex justify-between">
		{#each STEPS as step, i (step.key)}
			{@const done = i < currentStep}
			{@const active = i === currentStep}
			<li class="flex flex-col items-center gap-1.5" aria-current={active ? 'step' : undefined}>
				<span
					class="flex size-7 items-center justify-center rounded-full border bg-card transition-colors duration-300
						{done ? 'border-primary bg-primary text-primary-foreground' : ''}
						{active ? 'border-primary text-accent shadow-brand-subtle' : ''}
						{!done && !active ? 'border-border text-muted-foreground/50' : ''}"
				>
					{#if done}
						<CheckIcon class="size-3.5" strokeWidth={2.4} />
					{:else}
						<span
							class="relative flex size-1.5 rounded-full {active
								? 'bg-primary'
								: 'bg-muted-foreground/30'}"
						>
							{#if active}
								<span
									class="absolute -inset-0.75 rounded-full ring-2 ring-primary/40 motion-safe:animate-ping"
								></span>
							{/if}
						</span>
					{/if}
				</span>
				<span
					class="text-[0.65rem] font-medium tracking-wider uppercase {done || active
						? 'text-accent'
						: 'text-muted-foreground'}"
				>
					{step.label}
				</span>
				<span class="sr-only">{done ? 'Completado' : active ? 'En curso' : 'Pendiente'}</span>
			</li>
		{/each}
	</ol>
</div>
