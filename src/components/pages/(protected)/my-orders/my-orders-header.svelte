<script lang="ts">
	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// LUCIDE ICONS
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
</script>

<a
	href={appHref(PROTECTED_PAGE_ENDPOINTS.ACCOUNT)}
	class="group mb-8 inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
>
	<ArrowLeftIcon class="size-3.5 transition-transform group-hover:-translate-x-0.5" />
	Volver a la cuenta
</a>

<header class="mb-10">
	<p class="mb-3 text-[0.7rem] font-medium tracking-[0.3em] text-chart-2 uppercase">Tu cuenta</p>
	<h1 class="font-display text-4xl leading-[0.95] font-semibold tracking-wide text-accent sm:text-5xl">
		Historial de pedidos
	</h1>
	<!-- Gold rule + tagline, set as a single baseline for an editorial masthead feel. -->
	<div class="mt-5 flex items-center gap-4">
		<span class="h-px w-12 bg-gradient-to-r from-primary to-primary/0" aria-hidden="true"></span>
		<p class="text-sm text-muted-foreground">Todo lo que has pedido, lo más reciente primero.</p>
	</div>
</header>
