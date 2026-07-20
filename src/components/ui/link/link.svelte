<script lang="ts">
	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';

	// TYPES
	import type { HTMLAnchorAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	export type LinkProps = WithElementRef<
		Omit<HTMLAnchorAttributes, 'href'> & {
			href: string;
			children: Snippet;
		}
	>;

	let {
		class: className,
		href,
		ref = $bindable(null),
		children,
		...restProps
	}: LinkProps = $props();
</script>

<a bind:this={ref} data-slot="link" {href} class={cn(className)} {...restProps}>
	{@render children()}
</a>
