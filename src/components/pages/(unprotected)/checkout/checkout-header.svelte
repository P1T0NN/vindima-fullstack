<script lang="ts">
	// CONSTANTS
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints';

	// UTILS
	import { appHref } from '@/utils/app-navigation';
</script>

<a
	href={appHref(UNPROTECTED_PAGE_ENDPOINTS.SHOP)}
	class="mb-6 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-gold-ink uppercase no-underline transition-colors hover:text-accent"
>
	<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span> Volver a la tienda
</a>

<h1
	class="mb-8 font-display text-3xl font-semibold tracking-wide text-accent uppercase sm:text-4xl"
>
	Finalizar compra
</h1>
