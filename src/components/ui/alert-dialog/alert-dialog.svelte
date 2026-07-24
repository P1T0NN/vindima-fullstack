<script lang="ts">
	// COMPONENTS
	import AlertDialogTrigger from './alert-dialog-trigger.svelte';
	import { type ButtonSize, type ButtonVariant } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Label/content inside the default trigger button. */
		triggerChildren?: Snippet;
		triggerVariant?: ButtonVariant;
		triggerSize?: ButtonSize;
		triggerClass?: string;
		triggerDisabled?: boolean;
		/** Hide trigger for programmatic-only dialogs (e.g. URL-driven open). */
		hideTrigger?: boolean;
		children: Snippet<[{ dialogId: string }]>;
		class?: string;
	};

	let {
		open = $bindable(false),
		onOpenChange,
		triggerChildren,
		triggerVariant = 'default',
		triggerSize = 'default',
		triggerClass,
		triggerDisabled = false,
		hideTrigger = false,
		children,
		class: className
	}: Props = $props();

	const dialogId = $props.id();

	let dialog = $state<HTMLDialogElement | null>(null);

	function setOpen(nextOpen: boolean) {
		open = nextOpen;
		onOpenChange?.(nextOpen);
	}

	// Programmatic control (URL-driven open, bind:open after async actions).

	$effect(() => {
		if (!dialog) return;

		if (open && !dialog.open) {
			dialog.showModal();
			return;
		}

		if (!open && dialog.open) {
			dialog.close();
		}
	});
</script>

{#if !hideTrigger}
	<AlertDialogTrigger
		{dialogId}
		variant={triggerVariant}
		size={triggerSize}
		class={triggerClass}
		disabled={triggerDisabled}
	>
		{@render triggerChildren?.()}
	</AlertDialogTrigger>
{/if}

<dialog
	id={dialogId}
	bind:this={dialog}
	class={cn(
		'alert-dialog max-w-[calc(100%-2rem)] gap-4 rounded-xl bg-popover p-4 text-popover-foreground ring-1 ring-foreground/10 sm:max-w-sm',
		className
	)}
	oncancel={(event) => event.preventDefault()}
	ontoggle={(event) => setOpen(event.newState === 'open')}
>
	{#if open}
		{@render children({ dialogId })}
	{/if}
</dialog>

<style>
	dialog.alert-dialog::backdrop {
		background: rgb(0 0 0 / 0.1);
		backdrop-filter: blur(2px);
	}

	dialog.alert-dialog {
		margin: auto;
	}

	:global(.alert-dialog__header) {
		display: grid;
		gap: 0.375rem;
		text-align: center;
	}

	:global(.alert-dialog__header h2) {
		font-size: 1rem;
		font-weight: 500;
	}

	:global(.alert-dialog__header p) {
		color: var(--muted-foreground);
		font-size: 0.875rem;
		text-wrap: balance;
	}

	:global(.alert-dialog__footer) {
		display: flex;
		flex-direction: column-reverse;
		gap: 0.5rem;
		border-top: 1px solid var(--border);
		background: color-mix(in oklab, var(--muted) 50%, transparent);
		margin: 1rem -1rem -1rem;
		padding: 1rem;
		border-bottom-left-radius: 0.75rem;
		border-bottom-right-radius: 0.75rem;
	}

	@media (min-width: 640px) {
		:global(.alert-dialog__footer) {
			flex-direction: row;
			justify-content: flex-end;
		}

		:global(.alert-dialog__header) {
			text-align: left;
		}
	}
</style>
