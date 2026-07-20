<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { Card, CardHeader, CardContent } from '@/components/ui/card/index.js';
</script>

<!-- Mirrors the edit form: two detail cards, a variants card, and the action row. -->
<div class="flex flex-col gap-6">
	<!-- Product details -->
	<Card>
		<CardHeader class="gap-2">
			<Skeleton class="h-5 w-40" />
			<Skeleton class="h-4 w-64" />
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2 sm:col-span-2">
					<Skeleton class="h-4 w-16" />
					<Skeleton class="h-9 w-full" />
				</div>
				<div class="flex flex-col gap-2 sm:col-span-2">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="h-16 w-full" />
				</div>
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-12" />
					<Skeleton class="h-9 w-full" />
				</div>
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-9 w-full" />
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Merchandising -->
	<Card>
		<CardHeader class="gap-2">
			<Skeleton class="h-5 w-36" />
			<Skeleton class="h-4 w-56" />
		</CardHeader>
		<CardContent>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div class="flex flex-col gap-2 sm:col-span-2">
					<Skeleton class="h-4 w-28" />
					<Skeleton class="h-24 w-full rounded-lg" />
				</div>
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-9 w-full" />
				</div>
				<div class="flex items-center gap-2 sm:col-span-2">
					<Skeleton class="h-5 w-9 rounded-full" />
					<Skeleton class="h-4 w-24" />
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Variants -->
	<Card>
		<CardHeader class="gap-2">
			<Skeleton class="h-5 w-24" />
			<Skeleton class="h-4 w-72" />
		</CardHeader>
		<CardContent class="flex flex-col gap-3">
			{#each [0, 1] as i (i)}
				<div class="flex flex-col gap-3 rounded-lg border border-border p-3">
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Skeleton class="h-9 w-full" />
						<Skeleton class="h-9 w-full" />
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<Skeleton class="h-9 w-full" />
						<Skeleton class="h-9 w-full" />
					</div>
					<Skeleton class="h-5 w-28" />
				</div>
			{/each}
			<Skeleton class="h-8 w-28" />
		</CardContent>
	</Card>

	<!-- Actions -->
	<div class="flex items-center gap-3 border-t pt-4">
		<Skeleton class="h-9 w-32" />
		<Skeleton class="h-9 w-24" />
	</div>
</div>
