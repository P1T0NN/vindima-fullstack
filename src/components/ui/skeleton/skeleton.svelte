<script lang="ts">
	import { cn, type WithElementRef, type WithoutChildren } from '@/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<!-- Decorative placeholder: hidden from AT; wrappers announce loading via aria-busy. -->
<div
	bind:this={ref}
	data-slot="skeleton"
	aria-hidden="true"
	class={cn('animate-pulse rounded-md bg-muted', className)}
	{...restProps}
></div>
