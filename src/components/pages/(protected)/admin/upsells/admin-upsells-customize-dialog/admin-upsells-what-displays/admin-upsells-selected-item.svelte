<script lang="ts">
	// A chosen upsell item, shown as a removable pill above the search.

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';

	let { label, onRemove }: { label: string; onRemove: () => void } = $props();
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary/12 py-1 pr-1 pl-2 text-xs"
>
	<span class="max-w-40 truncate">{label}</span>
	<Button
		variant="ghost"
		size="icon-xs"
		aria-label="Quitar"
		onclick={onRemove}
		class="size-4 text-primary hover:bg-primary/20"
	>
		<XIcon class="size-3" />
	</Button>
</span>
