<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the real table's rhythm (header row + ruled entries, total right-aligned) so the
     swap-in causes zero layout shift. -->
<div role="status" aria-busy="true" aria-label="Cargando historial de compras">
	<div class="grid grid-cols-3 gap-4 pb-3">
		<Skeleton class="h-3 w-12" />
		<Skeleton class="h-3 w-16" />
		<Skeleton class="h-3 w-12 justify-self-end" />
	</div>

	{#each Array(3), i (i)}
		<div class="grid grid-cols-3 items-center gap-4 border-t border-accent/10 py-3.5">
			<Skeleton class="h-4 w-20" />
			<Skeleton class="h-4 w-full max-w-44" />
			<Skeleton class="h-5 w-16 justify-self-end" />
		</div>
	{/each}
</div>
