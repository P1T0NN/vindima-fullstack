<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
</script>

<div
	class="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed px-6 py-16 text-center"
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
		<span class="icon-[lucide--tag] size-6" ></span>
	</div>

	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">Categoría no encontrada</h2>
		<p class="max-w-sm text-sm text-muted-foreground">
			La categoría que buscas no existe o pudo haber sido eliminada.
		</p>
	</div>

	<Button variant="outline" size="sm" onclick={() => appGoto(ADMIN_PAGE_ENDPOINTS.CATEGORIES)}>
		<span class="icon-[lucide--arrow-left] size-4" ></span>
		Volver a categorías
	</Button>
</div>
