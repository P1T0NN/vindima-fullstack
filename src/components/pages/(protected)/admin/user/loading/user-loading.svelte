<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton';
</script>

<div role="status" aria-label="Cargando usuario" class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<Skeleton class="size-12 shrink-0 rounded-full" />
		<div class="flex flex-col gap-2">
			<Skeleton class="h-7 w-44 max-w-[60vw]" />
			<Skeleton class="h-4 w-56 max-w-[70vw]" />
		</div>
	</div>

	<div class="grid max-w-xl gap-5 rounded-xl border bg-card p-5 sm:grid-cols-2">
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-12" /><Skeleton class="h-8 w-40" />
		</div>
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-14" /><Skeleton class="h-6 w-24" />
		</div>
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-14" /><Skeleton class="h-5 w-24" />
		</div>
		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-20" /><Skeleton class="h-5 w-28" />
		</div>
	</div>
</div>
