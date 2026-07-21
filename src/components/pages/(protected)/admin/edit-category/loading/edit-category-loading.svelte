<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { Card, CardHeader, CardContent } from '@/components/ui/card/index.js';
</script>

<!-- Mirrors the edit form: one details card (name, description, image) and the action row. -->
<div class="flex flex-col gap-6">
	<Card>
		<CardHeader class="gap-2">
			<Skeleton class="h-5 w-32" />
			<Skeleton class="h-4 w-56" />
		</CardHeader>

		<CardContent>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-16" />
					<Skeleton class="h-9 w-full" />
				</div>

				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-24" />
					<Skeleton class="h-16 w-full" />
				</div>

				<div class="flex flex-col gap-2">
					<Skeleton class="h-4 w-20" />
					<Skeleton class="h-24 w-full max-w-md rounded-lg" />
				</div>
			</div>
		</CardContent>
	</Card>

	<div class="flex items-center gap-3 border-t pt-4">
		<Skeleton class="h-9 w-32" />
		<Skeleton class="h-9 w-24" />
	</div>
</div>
