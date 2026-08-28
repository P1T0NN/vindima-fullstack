<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// Native <dialog> modal: the browser blocks the page behind it, centers it
	// with a backdrop, and focuses the first control. Click-outside can never
	// close a modal <dialog>; Esc is disabled by cancelling the `cancel` event,
	// so the only exits are the close affordances the caller renders via the
	// `close` snippet arg. The dialog element is the source of truth — `open`
	// and `close` are plain event handlers on the native API, so there is no
	// state to sync and no $effect. The trigger snippet must be a button (or
	// another element with `onclick`); pass the `open` handler to it.
	let {
		trigger,
		children,
		class: className
	}: {
		trigger?: Snippet<[{ open: () => void }]>;
		children: Snippet<[{ close: () => void }]>;
		class?: string;
	} = $props();

	let dialogEl: HTMLDialogElement | undefined;

	function captureDialog(element: HTMLDialogElement) {
		dialogEl = element;
		return () => {
			if (dialogEl === element) dialogEl = undefined;
		};
	}

	export function open() {
		dialogEl?.showModal();
	}

	export function close() {
		dialogEl?.close();
	}
</script>

{#if trigger}
	{@render trigger?.({ open })}
{/if}

<dialog
	{@attach captureDialog}
	oncancel={(e) => e.preventDefault()}
	class={cn(
		'native-dialog m-auto w-full max-w-md rounded-2xl border bg-popover p-0 text-popover-foreground shadow-lg backdrop:bg-black/50 backdrop:backdrop-blur-sm',
		className
	)}
>
	{@render children?.({ close })}
</dialog>

<style>
	dialog {
		overflow-x: clip;
		overflow-wrap: anywhere;
		white-space: normal;
	}

	dialog:not([open]) {
		display: none;
	}
</style>
