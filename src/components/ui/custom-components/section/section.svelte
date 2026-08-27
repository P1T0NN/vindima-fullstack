<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// LAYOUT
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	// Section: a layout band that centres its content and owns the page's
	// vertical rhythm, so callers never repeat max-w / mx-auto / px / py.
	//
	// Two layers, each with its own class prop — this is what makes it
	// full-bleed friendly:
	//   - class          → the outer band (background, borders, vertical padding)
	//   - containerClass → the centred content box (grids, alignment, ...)
	// So `<Section class="bg-muted" size="lg">` tints the whole width of the
	// page, not just the centred column. Any other attributes (id, aria-*,
	// data-*) land on the outer element automatically.
	type YPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
	type Surface = 'transparent' | 'background' | 'muted';

	let {
		children,
		as = 'section',
		size = 'md',
		width = 'default',
		containerClass,
		class: className,
		contain,
		yPadding,
		surface,
		fillViewport = false,
		centerContent = false,
		ariaLabelledby,
		'aria-labelledby': ariaLabelledbyAttribute,
		...restProps
	}: HTMLAttributes<HTMLElement> & {
		children?: Snippet;
		/** Semantic element to render — keeps this useful where <section> isn't right. */
		as?: 'section' | 'div' | 'article' | 'header' | 'footer' | 'main' | 'aside' | 'nav';
		/** Vertical padding of the band. */
		size?: 'none' | 'sm' | 'md' | 'lg';
		/** Max width of the centred content. */
		width?: 'narrow' | 'default' | 'wide' | 'full';
		/** Classes for the centred content box (grids, alignment, ...). */
		containerClass?: string;
		class?: string;
		/** Legacy: use the shared page container when true. */
		contain?: boolean;
		/** Legacy vertical padding API. */
		yPadding?: YPadding;
		/** Legacy theme surface API. */
		surface?: Surface;
		/** Legacy: make the section at least one viewport tall. */
		fillViewport?: boolean;
		/** Legacy: center the inner content. */
		centerContent?: boolean;
		/** Legacy camel-case alias for `aria-labelledby`. */
		ariaLabelledby?: string;
	} = $props();

	const sizes = {
		none: '',
		sm: 'py-8',
		md: 'py-16',
		lg: 'py-24'
	};

	const widths = {
		narrow: 'max-w-4xl',
		default: 'max-w-6xl',
		wide: 'max-w-7xl',
		full: 'max-w-full'
	};

	const yPaddings: Record<YPadding, string> = {
		none: '',
		sm: 'py-8 sm:py-10',
		md: 'py-12 sm:py-14 lg:py-16',
		lg: 'py-16 sm:py-20 lg:py-24',
		xl: 'py-20 sm:py-24 lg:py-32'
	};

	const surfaces: Record<Surface, string> = {
		transparent: '',
		background: 'bg-background',
		muted: 'bg-muted'
	};

	const usesLegacyLayout = $derived(
		contain !== undefined ||
			yPadding !== undefined ||
			surface !== undefined ||
			fillViewport ||
			centerContent ||
			ariaLabelledby !== undefined ||
			ariaLabelledbyAttribute !== undefined
	);

	const containerLayoutClass = $derived(
		centerContent
			? fillViewport
				? 'flex flex-1 flex-col items-center justify-center'
				: 'flex flex-col items-center justify-center'
			: ''
	);

	const sectionClass = $derived(
		usesLegacyLayout
			? cn(
					'w-full max-w-full min-w-0 overflow-x-clip',
					fillViewport && 'flex min-h-dvh flex-col',
					surfaces[surface ?? 'transparent'],
					yPaddings[yPadding ?? 'md'],
					className
				)
			: cn('w-full', sizes[size], className)
	);

	const contentClass = $derived(
		usesLegacyLayout
			? cn(
					contain === false ? 'min-w-0' : cn(PAGE_CONTAINER, 'min-w-0'),
					containerLayoutClass,
					containerClass
				)
			: cn('mx-auto w-full px-4 sm:px-6', widths[width], containerClass)
	);
</script>

<svelte:element
	this={as}
	class={sectionClass}
	aria-labelledby={ariaLabelledby ?? ariaLabelledbyAttribute}
	{...restProps}
>
	<div class={contentClass}>
		{@render children?.()}
	</div>
</svelte:element>
