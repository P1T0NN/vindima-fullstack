<script lang="ts">
	// CONFIG
	import { REWARDS_CONFIG } from '@/shared/config';

	// LUCIDE ICONS
	import GiftIcon from '@lucide/svelte/icons/gift';
</script>

<div
	class="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center"
>
	<GiftIcon class="size-6 text-muted-foreground" aria-hidden="true" />

	<p class="text-sm font-medium">Todavía no hay artículos de recompensa</p>

	<p class="max-w-sm text-xs text-muted-foreground">
		Los clientes siguen acumulando sellos, pero al llegar a {REWARDS_CONFIG.STAMPS_PER_REWARD} compras
		no podrán canjear nada hasta que añadas al menos uno.
	</p>
</div>
