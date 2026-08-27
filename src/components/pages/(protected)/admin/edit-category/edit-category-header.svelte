<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	</script>

<header class="flex flex-col gap-1">
	<a
		href={ADMIN_PAGE_ENDPOINTS.CATEGORIES}
		class="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
	>
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true" ></span>
		Categorías
	</a>

	<h1 class="text-2xl font-semibold tracking-tight">Editar categoría</h1>
</header>
