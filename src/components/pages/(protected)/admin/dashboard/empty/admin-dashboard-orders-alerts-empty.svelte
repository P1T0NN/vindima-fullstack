<script lang="ts">
	// All-clear state for Zone 1 — shown when nothing is waiting on the owner. Good news
	// should cost zero attention, so it's one quiet line, not empty cards.

	// LUCIDE ICONS
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
</script>

<p class="flex items-center gap-2 text-sm text-muted-foreground">
	<CircleCheckIcon class="size-4 text-chart-2" aria-hidden="true" />
	Todo al día — no hay pedidos esperándote.
</p>
