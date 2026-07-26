<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import TrackOrderHeader from '@/components/pages/(unprotected)/track-order/track-order-header.svelte';
	import TrackOrderForm from '@/components/pages/(unprotected)/track-order/track-order-form.svelte';

	/**
	 * Guest order lookup. A guest has no identity we can list orders against, so this page
	 * promises exactly ONE order and asks for the two things that together prove possession:
	 * the number printed on their confirmation, and the email it was sent to.
	 */
</script>

<SvelteHead
	title="Rastrear pedido"
	noindex
	description="Consulta el estado de tu pedido de Vindima con tu número de pedido y tu correo."
/>

<Section surface="background" yPadding="xl" class="min-h-[calc(100dvh-3.5rem)]">
	<div class="mx-auto w-full max-w-md">
		<TrackOrderHeader />

		<TrackOrderForm />

		<p class="mt-10 border-t border-accent/10 pt-6 text-xs leading-relaxed text-muted-foreground">
			¿Tienes cuenta? <a
				href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}
				class="text-accent underline underline-offset-4">Inicia sesión</a
			> y verás todos tus pedidos en un solo lugar.
		</p>
	</div>
</Section>
