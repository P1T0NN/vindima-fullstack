<script lang="ts">
	// COMPONENTS
	import { Badge } from '@/components/ui/badge/index.js';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';
</script>

<div class="mx-5 mb-5 sm:mx-6">
	<Badge variant="outline" class="gap-2.5 rounded-xl bg-muted/40 px-4 py-3 text-muted-foreground">
		<XIcon class="size-4" strokeWidth={1.6} />
		Este pedido fue cancelado.
	</Badge>
</div>
