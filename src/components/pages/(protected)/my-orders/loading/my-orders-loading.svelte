<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	const cardPlaceholders = [0, 1, 2];
	const railNodes = [0, 1, 2];
</script>

<!-- Mirrors the order-card layout (masthead → rail → ledger → total) so real cards swap in cleanly. -->
<div class="flex flex-col gap-4" aria-busy="true" aria-label="Cargando tus pedidos">
	{#each cardPlaceholders as index (index)}
		<div class="overflow-hidden rounded-2xl border border-accent/12 bg-card shadow-brand-subtle">
			<!-- Masthead -->
			<div class="flex items-start justify-between gap-4 px-6 pt-6 pb-5">
				<div class="flex flex-col gap-2.5">
					<Skeleton class="h-7 w-32 rounded-md" />
					<Skeleton class="h-3 w-24 rounded-sm" />
				</div>
				<Skeleton class="h-6 w-20 rounded-full" />
			</div>

			<!-- Rail -->
			<div class="relative mx-6 mt-1 mb-6">
				<div class="absolute top-3.5 right-3.5 left-3.5 h-px bg-border" aria-hidden="true"></div>
				<div class="relative flex justify-between">
					{#each railNodes as node (node)}
						<div class="flex flex-col items-center gap-1.5">
							<Skeleton class="size-7 rounded-full" />
							<Skeleton class="h-2.5 w-14 rounded-sm" />
						</div>
					{/each}
				</div>
			</div>

			<!-- Ledger -->
			<div class="flex flex-col gap-3 border-t border-accent/10 px-6 pt-4 pb-4">
				<div class="flex justify-between">
					<Skeleton class="h-4 w-40 rounded-sm" />
					<Skeleton class="h-4 w-14 rounded-sm" />
				</div>
				<div class="flex justify-between">
					<Skeleton class="h-4 w-28 rounded-sm" />
					<Skeleton class="h-4 w-12 rounded-sm" />
				</div>
			</div>

			<!-- Total -->
			<div class="flex items-center justify-between border-t border-accent/12 bg-primary/6 px-6 py-4">
				<Skeleton class="h-3 w-12 rounded-sm" />
				<Skeleton class="h-6 w-20 rounded-md" />
			</div>
		</div>
	{/each}
</div>
