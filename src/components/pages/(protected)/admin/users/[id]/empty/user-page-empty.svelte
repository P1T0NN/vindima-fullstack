<script lang="ts">
	// LIBRARIES
	import UserXIcon from '@lucide/svelte/icons/user-x';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

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
		<UserXIcon class="size-6" />
	</div>

	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold">Usuario no encontrado</h2>
		<p class="max-w-sm text-sm text-muted-foreground">
			El usuario que buscas no existe o pudo haber sido eliminado.
		</p>
	</div>

	<Button variant="outline" size="sm" onclick={() => appGoto(ADMIN_PAGE_ENDPOINTS.USERS)}>
		<ArrowLeftIcon class="size-4" />
		Volver a usuarios
	</Button>
</div>
