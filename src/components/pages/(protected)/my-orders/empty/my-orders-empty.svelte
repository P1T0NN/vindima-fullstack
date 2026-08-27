<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

		</script>

<div class="flex flex-col items-center px-4 py-16 text-center sm:py-24">
	<!-- Icon medallion — concentric brand rings, same pattern as the empty cart. -->
	<div class="relative mb-9 flex size-40 items-center justify-center">
		<span class="absolute inset-0 rounded-full bg-primary/5" aria-hidden="true"></span>
		<span class="absolute inset-6 rounded-full bg-primary/10" aria-hidden="true"></span>
		<span
			class="relative flex size-20 items-center justify-center rounded-full border border-primary/30 bg-card shadow-brand-panel"
		>
			<span class="icon-[lucide--package] size-8 text-accent" ></span>
		</span>
	</div>

	<p class="mb-3 text-[0.7rem] font-medium tracking-[0.3em] text-gold-ink uppercase">Historial de pedidos</p>
	<h2 class="mb-3 font-display text-3xl font-semibold tracking-wide text-accent sm:text-4xl">
		Aún no tienes pedidos
	</h2>
	<p class="mb-9 max-w-sm text-sm leading-relaxed text-muted-foreground">
		Tus pedidos aparecerán aquí en cuanto realices uno, con seguimiento en vivo desde que se
		procesa hasta tu puerta.
	</p>

	<Button
		href="{UNPROTECTED_PAGE_ENDPOINTS.ROOT}{UNPROTECTED_PAGE_ENDPOINTS.SHOP}"
		class="group h-12 gap-2 px-8 text-sm tracking-wider uppercase"
	>
		Explora la tienda
		<span class="icon-[lucide--arrow-right] size-4 transition-transform group-hover:translate-x-0.5" ></span>
	</Button>
</div>
