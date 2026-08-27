<script lang="ts">
	import { Pagination as PaginationPrimitive } from 'bits-ui';
	import { buttonVariants } from '@/components/ui/button/index.js';
	import { cn } from '@/utils/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

<PaginationPrimitive.PrevButton
	bind:ref
	aria-label="Go to previous page"
	class={cn(buttonVariants({ variant: 'ghost', size: 'default' }), 'pl-1.5!', className)}
	{...restProps}
>
	<span class="icon-[lucide--chevron-left]" data-icon="inline-start" aria-hidden="true"></span>
	<span class="cn-pagination-previous-text hidden sm:block">Previous</span>
</PaginationPrimitive.PrevButton>
