<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import { Button } from '@/components/ui/button/index.js';

	const notFound = $derived(page.status === 404);
	const title = $derived(notFound ? 'Página no encontrada' : 'Algo salió mal');
	const detail = $derived(
		notFound
			? 'La página que buscas no existe o cambió de lugar.'
			: 'Ocurrió un error inesperado. Inténtalo de nuevo en un momento.'
	);
</script>

<SvelteHead {title} noindex description="Página de error de la tienda." />

<Section fillViewport centerContent surface="background" yPadding="none">
	<div class="flex w-full max-w-sm flex-col items-center gap-6 text-center">
		<p
			class="font-display text-[4rem] leading-none font-semibold tracking-[0.08em] text-accent tabular-nums"
		>
			{page.status}
		</p>

		<div class="flex flex-col gap-2">
			<h1 class="font-display text-2xl font-semibold tracking-wide text-accent uppercase">
				{title}
			</h1>
			<p class="text-sm leading-relaxed text-muted-foreground">{detail}</p>
		</div>

		<div class="mt-1 flex flex-wrap items-center justify-center gap-3">
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}>Volver al inicio</Button>
			{#if !notFound}
				<Button variant="outline" onclick={() => location.reload()}>Reintentar</Button>
			{/if}
		</div>
	</div>
</Section>
