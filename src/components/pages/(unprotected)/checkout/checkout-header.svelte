<script lang="ts">
	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// LUCIDE ICONS
	import { ArrowLeft } from '@lucide/svelte';
</script>

<a
	href={appHref(UNPROTECTED_PAGE_ENDPOINTS.SHOP)}
	class="mb-6 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
>
	<ArrowLeft class="size-4" /> Volver a la tienda
</a>

<h1
	class="mb-8 font-display text-3xl font-semibold tracking-wide text-accent uppercase sm:text-4xl"
>
	Finalizar compra
</h1>
