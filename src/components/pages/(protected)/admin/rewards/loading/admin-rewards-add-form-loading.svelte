<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex max-w-lg flex-col gap-4" aria-hidden="true">
	<div class="flex max-w-xs flex-col gap-1.5">
		<Skeleton class="h-4 w-20" />
		<Skeleton class="h-9 w-full" />
	</div>
	<Skeleton class="h-9 w-full" />
</div>
