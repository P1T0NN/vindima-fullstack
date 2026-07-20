<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
</script>

<!-- Shown instead of the form when there is nothing to check out — never a broken form. -->
<div class="flex flex-col items-center px-4 py-16 text-center sm:py-24">
	<!-- Icon medallion — concentric brand rings for depth. -->
	<div class="relative mb-8 flex size-40 items-center justify-center">
		<span class="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true"></span>
		<span class="absolute inset-6 rounded-full bg-primary/10" aria-hidden="true"></span>
		<span
			class="relative flex size-20 items-center justify-center rounded-full border border-primary/30 bg-card shadow-brand-panel"
		>
			<ShoppingBagIcon class="size-8 text-accent" strokeWidth={1.4} />
		</span>
	</div>

	<h2
		class="mb-3 font-display text-3xl font-semibold tracking-wide text-accent uppercase sm:text-4xl"
	>
		Tu carrito está vacío
	</h2>
	<p class="mb-8 max-w-sm text-sm leading-relaxed text-muted-foreground">
		Aún no hay nada. Explora la tienda y agrega algunos productos — aparecerán aquí, listos para
		pagar.
	</p>

	<Button
		href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}"
		class="group h-12 gap-2 px-8 text-sm tracking-wider uppercase"
	>
		Explorar la tienda
		<ArrowRightIcon class="size-4 transition-transform group-hover:translate-x-0.5" />
	</Button>
</div>
