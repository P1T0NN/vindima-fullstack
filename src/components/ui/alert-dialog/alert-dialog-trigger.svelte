<script lang="ts">
	// COMPONENTS
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant
	} from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = HTMLButtonAttributes & {
		dialogId: string;
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
	};

	let {
		dialogId,
		variant = 'default',
		size = 'default',
		class: className,
		disabled,
		children,
		type = 'button',
		...restProps
	}: Props = $props();
</script>

<button
	{type}
	command="show-modal"
	commandfor={dialogId}
	class={cn(buttonVariants({ variant, size }), className)}
	{disabled}
	{...restProps}
>
	{@render children?.()}
</button>
