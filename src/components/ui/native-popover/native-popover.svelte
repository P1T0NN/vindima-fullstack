<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Side = 'top' | 'right' | 'bottom' | 'left';
	type Align = 'start' | 'center' | 'end';

	type Props = {
		/**
		 * Controlled open state. LEAVE UNDEFINED for the zero-JS declarative path — open by
		 * spreading `props` (from the `trigger` snippet) onto your button (native `popovertarget`).
		 * Provide it only when external state must drive the popover.
		 */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		side?: Side;
		align?: Align;
		sideOffset?: number;
		contentClass?: string;
		/**
		 * Trigger area — receives `props` (incl. `popovertarget`) and `anchorStyle`
		 * (the `anchor-name`) to spread on your button.
		 */
		trigger?: Snippet<[{ props: Record<string, unknown>; anchorStyle: string }]>;
		/** Panel content; `popoverId` targets close buttons, `close()` closes from non-button elements. */
		content: Snippet<[{ popoverId: string; close: () => void }]>;
	};

	let {
		open = $bindable(undefined),
		onOpenChange,
		side = 'bottom',
		align = 'center',
		sideOffset = 4,
		contentClass,
		trigger,
		content
	}: Props = $props();

	const uid = $props.id();
	const popoverId = `${uid}-popover`;
	const anchorName = `--popover-${uid}`;

	// False only in pre-Popover-API browsers (pre-2023) → the CSS legacy fallback takes over.
	const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
	let panel = $state<HTMLElement | null>(null);

	const controlled = $derived(open !== undefined || onOpenChange !== undefined);

	// Spread onto the trigger button — `popovertarget` opens it, `anchorStyle` lets the panel
	// position against it. Both native, zero JS.
	const triggerProps = {
		type: 'button',
		popovertarget: popoverId,
		'aria-haspopup': 'menu'
	} as const;
	const anchorStyle = `anchor-name: ${anchorName};`;

	function setOpen(next: boolean) {
		open = next;
		onOpenChange?.(next);
	}

	function close() {
		if (supportsPopover) panel?.hidePopover();
		if (open !== undefined) setOpen(false);
	}

	// Controlled mode only — declarative usage returns instantly (no ongoing JS).
	$effect(() => {
		if (open === undefined || !panel) return;
		if (!supportsPopover) {
			panel.toggleAttribute('data-fallback-open', open);
			return;
		}
		if (open && !panel.matches(':popover-open')) panel.showPopover();
		else if (!open && panel.matches(':popover-open')) panel.hidePopover();
	});
</script>

{@render trigger?.({ props: triggerProps, anchorStyle })}

<div
	bind:this={panel}
	popover="auto"
	id={popoverId}
	data-side={side}
	data-align={align}
	style={`--popover-offset: ${sideOffset}px; position-anchor: ${anchorName};`}
	class={cn(
		'native-popover rounded-lg border bg-popover p-1 text-popover-foreground shadow-md',
		contentClass
	)}
	ontoggle={controlled
		? (event) => setOpen((event as ToggleEvent).newState === 'open')
		: undefined}
>
	{@render content({ popoverId, close })}
</div>

<style>
	/* Fade in when opened (top-layer, so needs @starting-style; degrades to instant show). */
	.native-popover:global([popover]) {
		opacity: 0;
		transition:
			opacity 0.12s ease,
			overlay 0.12s ease allow-discrete,
			display 0.12s ease allow-discrete;
	}

	.native-popover:global([popover]:popover-open) {
		opacity: 1;
	}

	@starting-style {
		.native-popover:global([popover]:popover-open) {
			opacity: 0;
		}
	}

	/*
	 * Tier 1 — anchor positioning (Chrome 125+, Firefox 132+, Safari 18.2+): place next
	 * to the trigger. Browsers WITH the Popover API but WITHOUT anchor positioning skip
	 * this block and keep the UA default — centered, fully usable (Tier 2, no CSS needed).
	 */
	@supports (position-area: bottom) {
		.native-popover:global([popover]) {
			margin: 0;
			position-try-fallbacks: flip-block, flip-inline;
		}

		.native-popover[data-side='bottom'] {
			position-area: bottom;
			margin-top: var(--popover-offset, 4px);
		}
		.native-popover[data-side='bottom'][data-align='start'] {
			position-area: bottom span-right;
		}
		.native-popover[data-side='bottom'][data-align='end'] {
			position-area: bottom span-left;
		}
		.native-popover[data-side='top'] {
			position-area: top;
			margin-bottom: var(--popover-offset, 4px);
		}
		.native-popover[data-side='top'][data-align='start'] {
			position-area: top span-right;
		}
		.native-popover[data-side='top'][data-align='end'] {
			position-area: top span-left;
		}
		.native-popover[data-side='right'] {
			position-area: right;
			margin-left: var(--popover-offset, 4px);
		}
		.native-popover[data-side='right'][data-align='start'] {
			position-area: right span-bottom;
		}
		.native-popover[data-side='right'][data-align='end'] {
			position-area: right span-top;
		}
		.native-popover[data-side='left'] {
			position-area: left;
			margin-right: var(--popover-offset, 4px);
		}
		.native-popover[data-side='left'][data-align='start'] {
			position-area: left span-bottom;
		}
		.native-popover[data-side='left'][data-align='end'] {
			position-area: left span-top;
		}
	}

	/*
	 * Tier 3 — no Popover API at all (pre-2023): classic absolute popover under the
	 * trigger. Without this the panel would render permanently visible in the page flow.
	 * (Declarative-only popovers can't open here without JS; use controlled mode if you
	 * must support those browsers.)
	 */
	@supports not selector(:popover-open) {
		.native-popover:global([popover]) {
			display: none;
			position: absolute;
			margin: 0;
			z-index: 50;
			opacity: 1;
		}

		.native-popover:global([popover][data-fallback-open]) {
			display: block;
		}
	}
</style>
