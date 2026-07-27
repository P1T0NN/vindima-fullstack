<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';

	// TYPES
	import type { Snippet } from 'svelte';

	type Side = 'top' | 'right' | 'bottom' | 'left';

	type Props = {
		/**
		 * Controlled open state. LEAVE UNDEFINED for the zero-JS declarative path — open by
		 * spreading `props` (from the `trigger` snippet) onto your button (native `popovertarget`).
		 * Provide it only when external state must drive the sheet (e.g. a keyboard shortcut).
		 */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		side?: Side;
		class?: string;
		/** Inline style on the panel (e.g. CSS custom properties). */
		style?: string;
		showCloseButton?: boolean;
		/** Accessible name for the dialog. */
		title?: string;
		/** Trigger area — receives `props` (incl. `popovertarget`) to spread on your button. */
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		/** Panel content; `popoverId` targets close buttons, `close()` closes from non-button elements. */
		children: Snippet<[{ popoverId: string; close: () => void }]>;
	};

	let {
		open = $bindable(undefined),
		onOpenChange,
		side = 'right',
		class: className,
		style,
		showCloseButton = true,
		title,
		trigger,
		children
	}: Props = $props();

	const uid = $props.id();
	const popoverId = `${uid}-sheet`;

	// False only in pre-Popover-API browsers (pre-2023) → the CSS legacy fallback takes over.
	const supportsPopover = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
	let panel = $state<HTMLElement | null>(null);

	// Controlled only when the consumer wires state. Declarative usage stays 100% native.
	const controlled = $derived(open !== undefined || onOpenChange !== undefined);

	// Spread onto the trigger button — opening/closing is entirely native (`popovertarget`).
	const triggerProps = {
		type: 'button',
		popovertarget: popoverId,
		'aria-haspopup': 'dialog'
	} as const;

	function setOpen(next: boolean) {
		open = next;
		onOpenChange?.(next);
	}

	/** Close from elements that can't use `popovertarget` (e.g. a nav `<a>`). */
	function close() {
		if (supportsPopover) panel?.hidePopover();
		if (open !== undefined) setOpen(false);
	}

	// Mirror native open/close back into external state (controlled mode), and own the focus
	// contract `aria-modal` promises: popovers, unlike `<dialog>.showModal()`, neither move
	// focus in nor trap it, so without this a keyboard user stays in the page behind the scrim.
	let previouslyFocused: HTMLElement | null = null;

	function handleToggle(event: ToggleEvent) {
		const isOpen = event.newState === 'open';
		if (controlled) setOpen(isOpen);

		if (isOpen) {
			previouslyFocused = document.activeElement as HTMLElement | null;
			panel?.focus();
		} else {
			previouslyFocused?.focus();
			previouslyFocused = null;
		}
	}

	// Minimal Tab cycle — Esc/light-dismiss stay native (`popover="auto"`).
	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab' || !panel) return;

		const focusables = Array.from(
			panel.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null);
		if (focusables.length === 0) return;

		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		const active = document.activeElement;

		if (event.shiftKey && (active === first || active === panel)) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}

	// Runs only in controlled mode — bridges external `open` to the native popover.
	// In declarative mode `open` is undefined, so this returns instantly (no ongoing JS).
	$effect(() => {
		if (open === undefined || !panel) return;

		// Legacy fallback: no Popover API — drive visibility with an attribute instead.
		if (!supportsPopover) {
			panel.toggleAttribute('data-fallback-open', open);
			return;
		}

		if (open && !panel.matches(':popover-open')) panel.showPopover();
		else if (!open && panel.matches(':popover-open')) panel.hidePopover();
	});
</script>

<!-- Wrapper (layout-neutral) so CSS `:has()` can read the panel's open state and swap
     trigger icons — see the [data-sheet-icon] rules below. Zero JS. -->
<span class="native-sheet-root">
	{@render trigger?.({ props: triggerProps })}

	<div
		bind:this={panel}
		popover="auto"
		id={popoverId}
	role="dialog"
	aria-modal="true"
	aria-label={title}
	data-side={side}
	tabindex="-1"
	{style}
	class={cn('native-sheet', className)}
	ontoggle={handleToggle}
	onkeydown={handleKeydown}
>
	{@render children({ popoverId, close })}

	{#if showCloseButton}
		<Button
			variant="ghost"
			size="icon-sm"
			class="absolute top-3 right-3"
			popovertarget={popoverId}
			popovertargetaction="hide"
		>
			<XIcon />
			<span class="sr-only">Cerrar</span>
		</Button>
	{/if}
	</div>
</span>

<style>
	/* Layout-neutral wrapper — exists only so `:has()` can reach the panel's open state. */
	.native-sheet-root {
		display: contents;
	}

	/*
	 * Open/closed icon swap for any trigger — ZERO JS. Mark two elements in the trigger:
	 *   <MenuIcon data-sheet-icon="closed" />   (shown while closed)
	 *   <XIcon    data-sheet-icon="open" />      (shown while open)
	 * Base hides the "open" icon so it's correct even without :has(); when the panel is
	 * open, :has() flips them. `:has()` is Baseline (Dec 2023).
	 */
	:global([data-sheet-icon='open']) {
		display: none;
	}
	.native-sheet-root:has(.native-sheet:popover-open) :global([data-sheet-icon='open']) {
		display: revert;
	}
	.native-sheet-root:has(.native-sheet:popover-open) :global([data-sheet-icon='closed']) {
		display: none;
	}

	.native-sheet:global([popover]) {
		position: fixed;
		/* Reset the UA's `inset: 0` centering — otherwise `left: 0` fights the side's `right: 0`
		   and the panel pins to the WRONG edge (left) while sliding in from the right. */
		inset: auto;
		/* Top layer ignores z-index (harmless); required by the legacy fallback below. */
		z-index: 50;
		margin: 0;
		border: 0;
		max-height: none;
		overflow: auto;
		box-shadow: var(--shadow-brand-panel);
		/* NOTE: do NOT set `display` here — that would override the UA's
		   `[popover]:not(:popover-open){display:none}` and leave the panel visible while
		   closed. `display: flex` is set only on `:popover-open` below. */
		flex-direction: column;

		/* Slide + fade; transition works in the top layer via allow-discrete. */
		transition:
			transform 0.3s ease,
			opacity 0.3s ease,
			overlay 0.3s ease allow-discrete,
			display 0.3s ease allow-discrete;
	}

	/* Overridable defaults — consumer utilities like `p-5`, `bg-background`, `gap-*` must win.
	   `:where()` alone is NOT enough: Tailwind v4 emits utilities inside `@layer utilities`,
	   and ANY unlayered rule beats a layered one no matter how low its specificity. So these
	   defaults live in `base` (declared before `utilities` by `@import 'tailwindcss'`). */
	@layer base {
		:where(.native-sheet[popover]) {
			padding: 0;
			gap: 1rem;
			background: var(--popover);
			color: var(--popover-foreground);
		}
	}

	/* Dimmed backdrop (free with popover). */
	.native-sheet:global([popover])::backdrop {
		/* Posos-tinted scrim, never neutral black (No Pure Ink Rule) */
		background: rgba(28, 20, 24, 0.5);
		opacity: 0;
		transition:
			opacity 0.3s ease,
			overlay 0.3s ease allow-discrete,
			display 0.3s ease allow-discrete;
	}
	.native-sheet:global([popover]:popover-open)::backdrop {
		opacity: 1;
	}
	@starting-style {
		.native-sheet:global([popover]:popover-open)::backdrop {
			opacity: 0;
		}
	}

	/* Sides: pin to an edge, size, and set the closed/open transform. */
	.native-sheet[data-side='right'],
	.native-sheet[data-side='left'] {
		inset-block: 0;
		height: 100%;
	}
	/* Default width via :where() (0 specificity) so a consumer's `w-…` class wins. */
	.native-sheet:where([data-side='right'], [data-side='left']) {
		width: 75%;
		max-width: 24rem;
	}
	.native-sheet[data-side='right'] {
		right: 0;
		border-left: 1px solid var(--border);
	}
	.native-sheet[data-side='left'] {
		left: 0;
		border-right: 1px solid var(--border);
	}
	.native-sheet[data-side='top'],
	.native-sheet[data-side='bottom'] {
		inset-inline: 0;
		width: 100%;
		height: auto;
	}
	.native-sheet[data-side='top'] {
		top: 0;
		border-bottom: 1px solid var(--border);
	}
	.native-sheet[data-side='bottom'] {
		bottom: 0;
		border-top: 1px solid var(--border);
	}

	/* Closed (and starting) transform per side. */
	.native-sheet[data-side='right'] {
		transform: translateX(100%);
	}
	.native-sheet[data-side='left'] {
		transform: translateX(-100%);
	}
	.native-sheet[data-side='top'] {
		transform: translateY(-100%);
	}
	.native-sheet[data-side='bottom'] {
		transform: translateY(100%);
	}

	.native-sheet:global([popover]:popover-open) {
		display: flex;
		transform: none;
	}
	/* Force hidden while closed even if a consumer passes a `display` utility (e.g. `flex`)
	   on the panel — this beats utility-class specificity. `allow-discrete` (above) still
	   animates the close before `display: none` takes effect. */
	.native-sheet:global([popover]:not(:popover-open)) {
		display: none;
	}
	@starting-style {
		.native-sheet:global([popover]:popover-open) {
			transform: var(--sheet-closed-transform);
		}
	}
	.native-sheet[data-side='right'] {
		--sheet-closed-transform: translateX(100%);
	}
	.native-sheet[data-side='left'] {
		--sheet-closed-transform: translateX(-100%);
	}
	.native-sheet[data-side='top'] {
		--sheet-closed-transform: translateY(-100%);
	}
	.native-sheet[data-side='bottom'] {
		--sheet-closed-transform: translateY(100%);
	}

	/* Lock body scroll while open (pure CSS). */
	:global(body:has(.native-sheet:popover-open)) {
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.native-sheet:global([popover]),
		.native-sheet:global([popover])::backdrop {
			transition: none;
		}
	}

	/*
	 * Legacy fallback — no Popover API (pre-2023). Without this, the unknown `popover`
	 * attribute would leave the panel permanently visible. Attribute-driven show/hide via
	 * the open-sync effect; position:fixed + z-index still work, so the sheet remains
	 * fully functional (no backdrop/Esc/light-dismiss, but open/close buttons all work).
	 */
	@supports not selector(:popover-open) {
		.native-sheet:global([popover]) {
			display: none;
		}

		.native-sheet:global([popover][data-fallback-open]) {
			display: flex;
			transform: none;
		}
	}

	/* Scroll lock for the legacy path (same :has() trick, keyed off the fallback attribute). */
	:global(body:has(.native-sheet[data-fallback-open])) {
		overflow: hidden;
	}
</style>
