<script lang="ts">
	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import { appHref } from '@/utils/app-navigation.js';

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

	const resolvedHref = $derived(appHref(href));
</script>

<a bind:this={ref} data-slot="link" href={resolvedHref} class={cn(className)} {...restProps}>
	{@render children()}
</a>
