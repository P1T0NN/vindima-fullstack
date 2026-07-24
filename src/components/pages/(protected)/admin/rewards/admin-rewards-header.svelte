<script lang="ts">
	// CONFIG
	import { REWARDS_CONFIG } from '@/shared/config';
</script>

<header class="flex flex-col gap-1">
	<h1 class="text-2xl font-semibold tracking-tight">Recompensas</h1>

	<p class="max-w-2xl text-sm text-muted-foreground">
		Los clientes obtienen un artículo gratis cada {REWARDS_CONFIG.STAMPS_PER_REWARD} compras. Elige
		aquí qué artículos pueden pedir.
	</p>
</header>
