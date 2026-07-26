<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Side = 'top' | 'bottom' | 'left' | 'right';

	type Props = {
		/** Tooltip body — plain text or a snippet for rich markup. */
		content: string | Snippet;
		/** The trigger; hovering/focusing it reveals the tooltip. */
		children: Snippet;
		side?: Side;
		/** Skip the tooltip entirely (still renders the trigger). */
		disabled?: boolean;
		/** Set true ONLY when the trigger is not itself focusable (plain text/icon). For
		    button/link triggers the wrapper must stay out of the tab order — a second stop
		    with no role or action is a phantom for keyboard users. */
		focusable?: boolean;
		/** Classes on the trigger wrapper. */
		class?: string;
		/** Classes on the tooltip bubble. */
		contentClass?: string;
	};

	let {
		content,
		children,
		side = 'top',
		disabled = false,
		focusable = false,
		class: className,
		contentClass
	}: Props = $props();

	// One id ties the anchor to the tooltip (SSR-safe, unique per instance).
	const uid = $props.id();
	const anchorName = `--tooltip-${uid}`;
	const tooltipId = `tooltip-${uid}`;

	const isSnippet = (v: string | Snippet): v is Snippet => typeof v === 'function';
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<!-- Focusable so keyboard users can reveal the tooltip (:focus-within), matching hover.
     The bubble is nested INSIDE the trigger: hover/focus anywhere keeps it open, and the
     trigger doubles as the positioning context for the universal absolute fallback. -->
<span
	class={cn('native-tooltip-trigger', className)}
	style={`anchor-name: ${anchorName};`}
	tabindex={focusable ? 0 : undefined}
	aria-describedby={disabled ? undefined : tooltipId}
>
	{@render children()}

	{#if !disabled}
		<span
			id={tooltipId}
			role="tooltip"
			data-side={side}
			class={cn('native-tooltip', contentClass)}
			style={`position-anchor: ${anchorName};`}
		>
			{#if isSnippet(content)}
				{@render content()}
			{:else}
				{content}
			{/if}
		</span>
	{/if}
</span>

<style>
	.native-tooltip-trigger {
		display: inline-block;
		/* Positioning context for the universal absolute fallback. */
		position: relative;
	}

	/* ---- Universal baseline (every browser): absolute, relative to the trigger. ---- */
	.native-tooltip {
		position: absolute;
		width: max-content;
		max-width: 16rem;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		background: var(--popover, #333);
		color: var(--popover-foreground, #fff);
		font-size: 0.75rem;
		line-height: 1rem;
		box-shadow: var(--shadow-brand-lift);
		z-index: 50;

		/* Hidden until hovered/focused; visibility (not display) keeps the transition. */
		opacity: 0;
		visibility: hidden;
		transition:
			opacity 0.15s ease,
			visibility 0.15s ease;
	}

	.native-tooltip[data-side='top'] {
		bottom: calc(100% + 0.375rem);
		left: 50%;
		translate: -50% 0;
	}
	.native-tooltip[data-side='bottom'] {
		top: calc(100% + 0.375rem);
		left: 50%;
		translate: -50% 0;
	}
	.native-tooltip[data-side='left'] {
		right: calc(100% + 0.375rem);
		top: 50%;
		translate: 0 -50%;
	}
	.native-tooltip[data-side='right'] {
		left: calc(100% + 0.375rem);
		top: 50%;
		translate: 0 -50%;
	}

	/* ---- Enhancement (Chrome 125+, Firefox 132+, Safari 18.2+): anchor positioning.
	   Escapes overflow clipping and flips into view at viewport edges. ---- */
	@supports (position-area: top) {
		.native-tooltip {
			position: fixed;
			position-try-fallbacks: flip-block, flip-inline;
		}

		.native-tooltip[data-side='top'] {
			inset: auto;
			translate: none;
			position-area: top;
			margin: 0 0 0.375rem 0;
		}
		.native-tooltip[data-side='bottom'] {
			inset: auto;
			translate: none;
			position-area: bottom;
			margin: 0.375rem 0 0 0;
		}
		.native-tooltip[data-side='left'] {
			inset: auto;
			translate: none;
			position-area: left;
			margin: 0 0.375rem 0 0;
		}
		.native-tooltip[data-side='right'] {
			inset: auto;
			translate: none;
			position-area: right;
			margin: 0 0 0 0.375rem;
		}
	}

	/* Reveal on hover or keyboard focus. The bubble is a descendant, so hovering it
	   keeps the trigger's :hover true — no extra selector needed to stay open. */
	.native-tooltip-trigger:hover > .native-tooltip,
	.native-tooltip-trigger:focus-within > .native-tooltip {
		opacity: 1;
		visibility: visible;
	}

	@media (prefers-reduced-motion: reduce) {
		.native-tooltip {
			transition: none;
		}
	}
</style>
