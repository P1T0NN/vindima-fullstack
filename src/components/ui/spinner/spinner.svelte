<script lang="ts">
	import { cn } from '@/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLSpanElement> = $props();
</script>

<span
	role="status"
	aria-label="Cargando"
	class={cn('icon-[lucide--loader-2] size-4 animate-spin', className)}
	{...restProps}
></span>
