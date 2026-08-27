<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		onOpen,
		label = 'Nueva sugerencia',
		class: className
	}: {
		onOpen: () => void;
		label?: string;
		class?: string;
	} = $props();
</script>

<Button onclick={onOpen} class={cn('shrink-0 gap-2', className)}>
	<span class="icon-[lucide--plus] size-4" aria-hidden="true"></span>
	{label}
</Button>
