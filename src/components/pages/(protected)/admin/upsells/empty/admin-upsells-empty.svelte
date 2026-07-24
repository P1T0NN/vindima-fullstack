<script lang="ts">
	// COMPONENTS
	import CreateUpsellButton from '../create-upsell-button.svelte';

	// LUCIDE ICONS
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

	// The builder dialog's id — the create button opens it natively (zero JS).
	let { dialogId }: { dialogId: string } = $props();
</script>

<div
	class="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-6 py-14 text-center"
>
	<span
		class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
	>
		<SparklesIcon class="size-6" strokeWidth={1.5} />
	</span>

	<div class="flex flex-col gap-1">
		<p class="font-medium">Aún no tienes sugerencias</p>
		<p class="max-w-sm text-sm text-muted-foreground">
			Crea tu primera sugerencia: elige un producto y qué ofrecerle al cliente cuando lo agregue al
			carrito.
		</p>
	</div>

	<CreateUpsellButton {dialogId} label="Crear sugerencia" />
</div>
