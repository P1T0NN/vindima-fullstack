<script lang="ts">
	// First-paint skeleton for /admin/dashboard — mirrors the real zones so the swap-in
	// causes no layout shift. Period switches do NOT show this (they dim instead).

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-6" aria-busy="true" aria-label="Cargando panel">
	<!-- Zone 1: order alerts strip -->
	<Skeleton class="h-14 w-full rounded-xl" />

	<!-- Zone 2: KPI row -->
	<div class="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
		{#each Array.from({ length: 5 }, (_, i) => i) as i (i)}
			<div class="flex flex-col gap-2 rounded-xl border border-primary/40 bg-card p-4 sm:p-5">
				<Skeleton class="h-3 w-20 rounded-sm" />
				<Skeleton class="h-8 w-28 rounded-sm" />
				<Skeleton class="h-4 w-14 rounded-sm" />
			</div>
		{/each}
	</div>

	<!-- Zone 3: chart + top list -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
		<Skeleton class="h-80 rounded-xl lg:col-span-2" />
		<Skeleton class="h-80 rounded-xl" />
	</div>

	<!-- Zone 4: secondary cards -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		<Skeleton class="h-44 rounded-xl" />
		<Skeleton class="h-44 rounded-xl" />
	</div>
</div>
