<script lang="ts">
	// Skeleton for the rule list while the subscription's first page loads.
</script>

<div class="flex flex-col gap-3">
	{#each Array(3) as _, i (i)}
		<div class="flex flex-col gap-3 rounded-lg border border-border p-4">
			<div class="h-4 w-2/3 animate-pulse rounded bg-muted"></div>
			<div class="flex gap-2">
				<div class="h-8 w-28 animate-pulse rounded-md bg-muted"></div>
				<div class="h-8 w-28 animate-pulse rounded-md bg-muted"></div>
			</div>
		</div>
	{/each}
</div>
