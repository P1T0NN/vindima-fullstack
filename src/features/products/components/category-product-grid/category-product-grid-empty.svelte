<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import PackageOpenIcon from '@lucide/svelte/icons/package-open';

	let {
		class: className,
		title = 'No hay productos disponibles por ahora',
		description = 'Vuelve pronto — actualizamos el menú con frecuencia.',
		showShopLink = true
	}: {
		class?: string;
		title?: string;
		description?: string;
		showShopLink?: boolean;
	} = $props();
</script>

<div
	class={cn(
		'flex flex-col items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-muted/30 px-6 py-12 text-center sm:py-14',
		className
	)}
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted">
		<PackageOpenIcon class="size-6 text-muted-foreground" aria-hidden="true" />
	</div>

	<div class="flex max-w-sm flex-col gap-1.5">
		<p class="font-display text-lg font-semibold tracking-wide text-accent uppercase">{title}</p>
		<p class="text-sm leading-relaxed text-muted-foreground">{description}</p>
	</div>

	{#if showShopLink}
		<Button
			href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}"
			variant="outline"
			class="mt-1 h-auto px-5 py-3 text-xs tracking-wider uppercase"
		>
			Ver otras categorías
		</Button>
	{/if}
</div>
