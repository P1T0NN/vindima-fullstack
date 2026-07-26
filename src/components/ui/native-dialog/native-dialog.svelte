<script lang="ts">
	// Native <dialog> modal — the browser gives us the top layer, focus trap, Esc, and
	// backdrop for free. Two ways to open it, same as the other native-* primitives:
	//   • Declarative (zero JS): render a <NativeDialogTrigger dialogId={...}> — the native
	//     `command="show-modal"` invoker opens it. Read `dialogId` from the children snippet.
	//   • Controlled: `bind:open` — a $effect bridges state to showModal()/close().
	// Backdrop click closes via native `closedby="any"`; older browsers simply need Esc or a
	// close button (graceful degradation, no JS fallback needed).

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Props = {
		/** Controlled open state — leave undefined for the declarative trigger path. */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Accessible name for the dialog. */
		title?: string;
		/** Explicit element id so a <NativeDialogTrigger> elsewhere on the page can target it.
		 *  Omit for a generated one (triggers inside the children snippet get it either way). */
		id?: string;
		class?: string;
		/** Panel content; `dialogId` targets triggers/close buttons, `close()` closes from JS. */
		children: Snippet<[{ dialogId: string; close: () => void }]>;
	};

	let {
		open = $bindable(undefined),
		onOpenChange,
		title,
		id,
		class: className,
		children
	}: Props = $props();

	const uid = $props.id();
	const dialogId = $derived(id ?? uid);

	let dialog = $state<HTMLDialogElement | null>(null);

	function setOpen(next: boolean) {
		if (open !== undefined) open = next;
		onOpenChange?.(next);
	}

	function close() {
		dialog?.close();
	}

	// Controlled mode only — declarative usage never enters here (open stays undefined).
	$effect(() => {
		if (open === undefined || !dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});
</script>

<dialog
	bind:this={dialog}
	id={dialogId}
	closedby="any"
	aria-label={title}
	class={cn(
		'native-dialog rounded-2xl bg-card p-6 text-foreground shadow-brand-elevated sm:p-7',
		className
	)}
	onclose={() => setOpen(false)}
	ontoggle={(event) => {
		if ((event as ToggleEvent).newState === 'open') setOpen(true);
	}}
>
	{@render children({ dialogId, close })}
</dialog>

<style>
	/* Force hidden while closed even if a consumer passes a `display` utility (e.g. `flex`)
	   on the dialog — author styles always beat the UA's `dialog:not([open]){display:none}`,
	   so without this an invisible closed dialog sits over the page eating clicks. The
	   compound selector (0,2,0) outweighs a single utility class. Same guard as native-sheet. */
	.native-dialog:not([open]) {
		display: none;
	}

	.native-dialog {
		margin: auto;
		border: 0;
		max-height: 90dvh;
		overflow-y: auto;

		/* Fade + zoom in/out; allow-discrete lets it animate out of the top layer. */
		opacity: 0;
		transform: scale(0.95);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease,
			overlay 0.15s ease allow-discrete,
			display 0.15s ease allow-discrete;
	}

	/* Overridable default width — 0 specificity so a consumer's `max-w-*` wins. */
	:where(.native-dialog) {
		width: calc(100% - 2rem);
		max-width: 28rem;
	}

	.native-dialog[open] {
		opacity: 1;
		transform: none;
	}

	@starting-style {
		.native-dialog[open] {
			opacity: 0;
			transform: scale(0.95);
		}
	}

	.native-dialog::backdrop {
		/* Posos-tinted scrim, never neutral black (No Pure Ink Rule) */
		background: rgba(28, 20, 24, 0.55);
		opacity: 0;
		transition:
			opacity 0.15s ease,
			overlay 0.15s ease allow-discrete,
			display 0.15s ease allow-discrete;
	}

	.native-dialog[open]::backdrop {
		opacity: 1;
	}

	@starting-style {
		.native-dialog[open]::backdrop {
			opacity: 0;
		}
	}

	/* Lock body scroll while open (pure CSS). */
	:global(body:has(dialog.native-dialog[open])) {
		overflow: hidden;
	}

	@media (prefers-reduced-motion: reduce) {
		.native-dialog,
		.native-dialog::backdrop {
			transition: none;
		}
	}
</style>
