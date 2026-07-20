<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-6">
	<!-- Tabs list -->
	<div class="flex w-fit gap-1 rounded-md bg-muted p-1">
		<Skeleton class="h-8 w-20" />
		<Skeleton class="h-8 w-20" />
		<Skeleton class="h-8 w-20" />
		<Skeleton class="h-8 w-20" />
		<Skeleton class="h-8 w-24" />
	</div>

	<!-- Overview tab content -->
	<div class="flex flex-col gap-6 pt-2">
		<!-- Avatar + name/email row -->
		<div class="flex items-center gap-4">
			<Skeleton class="size-16 rounded-full" />
			<div class="flex flex-col gap-2">
				<Skeleton class="h-5 w-40" />
				<div class="flex items-center gap-2">
					<Skeleton class="h-4 w-56" />
					<Skeleton class="h-4 w-16 rounded" />
				</div>
			</div>
		</div>

		<!-- Fields grid -->
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each [0, 1, 2, 3] as i (i)}
				<div class="flex flex-col gap-1.5">
					<Skeleton class="h-3 w-16" />
					<Skeleton class="h-4 w-40" />
				</div>
			{/each}
		</div>

		<!-- User ID -->
		<div class="flex flex-col gap-2">
			<Skeleton class="h-3 w-16" />
			<div class="flex items-center gap-2">
				<Skeleton class="h-7 w-72" />
				<Skeleton class="size-7 rounded" />
			</div>
		</div>
	</div>
</div>
