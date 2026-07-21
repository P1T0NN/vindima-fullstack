<script lang="ts">
	// LUCIDE ICONS
	import UtensilsCrossedIcon from '@lucide/svelte/icons/utensils-crossed';
</script>

<!-- Only reachable before the owner creates their first category (/admin/categories). -->
<div
	class="flex flex-col items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-muted/30 px-6 py-12 text-center sm:py-14"
>
	<div class="flex size-12 items-center justify-center rounded-full bg-muted">
		<UtensilsCrossedIcon class="size-6 text-muted-foreground" aria-hidden="true" />
	</div>

	<div class="flex max-w-sm flex-col gap-1.5">
		<p class="font-display text-lg font-semibold tracking-wide text-accent uppercase">
			El menú llega pronto
		</p>
		<p class="text-sm leading-relaxed text-muted-foreground">
			Estamos preparando nuestras categorías. Vuelve en un momento.
		</p>
	</div>
</div>
