<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// LUCIDE ICONS
	import InboxIcon from '@lucide/svelte/icons/inbox';

	type Props = {
		class?: string;
		title?: string;
		description?: string;
		children?: Snippet;
	};

	let {
		class: className,
		title = 'Sin resultados',
		description = 'Aún no hay nada que mostrar. Prueba a ajustar los filtros o añade datos nuevos.',
		children
	}: Props = $props();
</script>

<Card
	data-slot="data-table-empty"
	class={cn('items-center justify-center gap-3 px-6 py-12 text-center', className)}
	role="status"
>
	<span
		class="inline-flex size-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground ring-1 ring-border"
		aria-hidden="true"
	>
		<InboxIcon class="size-6 opacity-80" />
	</span>
	<div class="max-w-sm space-y-1">
		<p class="text-sm font-medium text-foreground">{title}</p>
		<p class="text-sm leading-relaxed text-muted-foreground">{description}</p>
	</div>
	{#if children}
		<div class="pt-1">{@render children()}</div>
	{/if}
</Card>
