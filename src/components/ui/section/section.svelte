<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type YPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
	type Surface = 'transparent' | 'background' | 'muted';

	type Props = {
		class?: string;
		/** Classes on the inner wrapper (e.g. grid / flex layouts). */
		containerClass?: string;
		children: Snippet;
		/**
		 * When true, inner content uses the shared `PAGE_CONTAINER` gutter so its
		 * left/right edges line up with the header and footer.
		 */
		contain?: boolean;
		/** Vertical padding for the section block. */
		yPadding?: YPadding;
		/** Optional band using existing theme surfaces. */
		surface?: Surface;
		/** At least one viewport tall — keeps footer below the fold on short pages. */
		fillViewport?: boolean;
		/** Center inner content; pairs with `fillViewport` for vertically centered page sections. */
		centerContent?: boolean;
		id?: string;
		ariaLabelledby?: string;
	};

	let {
		class: className,
		containerClass,
		children,
		contain = true,
		yPadding = 'md',
		surface = 'transparent',
		fillViewport = false,
		centerContent = false,
		id = undefined,
		ariaLabelledby = undefined
	}: Props = $props();

	const yPaddingClass: Record<YPadding, string> = {
		none: '',
		sm: 'py-8 sm:py-10',
		md: 'py-12 sm:py-14 lg:py-16',
		lg: 'py-16 sm:py-20 lg:py-24',
		xl: 'py-20 sm:py-24 lg:py-32'
	};

	const surfaceClass: Record<Surface, string> = {
		transparent: '',
		background: 'bg-background',
		muted: 'bg-muted'
	};

	const containerLayoutClass = $derived(
		centerContent
			? fillViewport
				? 'flex flex-1 flex-col items-center justify-center'
				: 'flex flex-col items-center justify-center'
			: ''
	);
</script>

<section
	{id}
	aria-labelledby={ariaLabelledby}
	class={cn(
		'w-full max-w-full min-w-0 overflow-x-clip',
		fillViewport && 'flex min-h-dvh flex-col',
		surfaceClass[surface],
		yPaddingClass[yPadding],
		className
	)}
>
	{#if contain}
		<div class={cn(PAGE_CONTAINER, 'min-w-0', containerLayoutClass, containerClass)}>
			{@render children()}
		</div>
	{:else}
		<div class={cn('min-w-0', containerLayoutClass, containerClass)}>
			{@render children()}
		</div>
	{/if}
</section>
