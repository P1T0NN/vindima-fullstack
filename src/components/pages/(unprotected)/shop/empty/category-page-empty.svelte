<script lang="ts">
	// SVELTEKIT IMPORTS
	import { resolve } from '$app/paths';

	// CONFIG
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
</script>

<!-- Shown when the streamed page data resolves to null — only reachable via a client-side
     navigation to a just-deleted category (direct hits 404 in the loader instead). -->
<Section
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-background py-14 pb-24 sm:py-16 sm:pb-28"
>
	<div class="relative {PAGE_CONTAINER} text-center">
		<h1 class="font-display text-3xl font-semibold tracking-wide text-accent uppercase">
			Categoría no encontrada
		</h1>
		<Button href="{resolve('/')}#shop" class="mt-8">
			<ArrowLeftIcon class="size-4" strokeWidth={1.75} />
			Volver a la tienda
		</Button>
	</div>
</Section>
