<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
</script>

<header class="flex flex-wrap items-center justify-between gap-3">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Categorías</h1>

		<p class="text-sm text-muted-foreground">
			Los grupos a los que pertenecen los productos — las páginas de la tienda y los formularios de
			producto las usan.
		</p>
	</div>

	<Button href={ADMIN_PAGE_ENDPOINTS.ADD_CATEGORY}>Nueva categoría</Button>
</header>
