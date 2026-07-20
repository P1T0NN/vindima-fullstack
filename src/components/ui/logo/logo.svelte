<script lang="ts">
	import { COMPANY_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import Link from '@/components/ui/link/link.svelte';
	import { cn } from '@/utils/utils.js';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = {
		class?: string;
		/** Passed through to `<img>` (e.g. brightness on dark heroes). */
		imgClass?: string;
		href?: string;
		alt?: string;
		/** Visual size in the header / drawer / auth panels. */
		size?: 'sm' | 'md' | 'lg';
	} & Omit<HTMLAnchorAttributes, 'href' | 'class' | 'children'>;

	let {
		class: className,
		imgClass,
		href = UNPROTECTED_PAGE_ENDPOINTS.ROOT,
		alt = `${COMPANY_DATA.NAME} logo`,
		size = 'md',
		...restProps
	}: Props = $props();

	const sizeStyles = $derived(
		size === 'sm'
			? 'h-7 max-h-7 w-auto max-w-[min(9rem,40vw)]'
			: size === 'lg'
				? 'h-28 max-h-32 w-auto max-w-[min(14rem,55vw)]'
				: 'h-8 max-h-9 w-auto max-w-[min(10rem,45vw)]'
	);
</script>

<Link
	{href}
	class={cn(
		'inline-flex min-w-0 shrink-0 items-center rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
		className
	)}
	{...restProps}
>
	<img
		src={COMPANY_DATA.LOGO}
		{alt}
		class={cn('object-contain object-left', sizeStyles, imgClass)}
		width="160"
		height="36"
		loading="eager"
		decoding="async"
		draggable="false"
	/>
</Link>
