<script lang="ts">
	// Confirm-action dialog on the native <dialog> AlertDialog: trigger button → confirm/cancel.
	// Same public API as before; the shell is now the browser's (focus trap, top layer, backdrop).

	// COMPONENTS
	import { AlertDialog } from '@/components/ui/alert-dialog/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	interface Props {
		// Function to call when action is confirmed
		function: () => Promise<void> | void;

		// State props
		isPending?: boolean;
		/** When true the confirm action is rendered disabled. Use for typed-confirm or form-validity gates. */
		actionDisabled?: boolean;

		// Style props
		triggerClass?: string;
		actionClass?: string;
		/** When true, the dialog gets destructive styling (red-tinted title, destructive action button). */
		isDestructive?: boolean;
		/** When true, the proceed/action button is hidden — only the cancel button remains. */
		hideProceed?: boolean;

		// Children
		triggerChildren?: import('svelte').Snippet;
		/** Form fields or any extra UI rendered between the description and the footer. */
		body?: import('svelte').Snippet;

		// Open state control
		open?: boolean;
		onOpenChange?: (open: boolean) => void;

		// Custom text
		title?: string;
		description?: string;
	}

	let {
		function: actionFunction,
		isPending = false,
		actionDisabled = false,
		triggerClass = 'w-full',
		actionClass = '',
		isDestructive = false,
		hideProceed = false,
		triggerChildren,
		body,
		open = $bindable(false),
		onOpenChange,
		title,
		description
	}: Props = $props();

	async function handleAction() {
		await actionFunction();
		open = false;
	}
</script>

<AlertDialog
	bind:open
	{onOpenChange}
	{triggerChildren}
	{triggerClass}
	class={isDestructive ? 'ring-destructive/30' : undefined}
>
	{#snippet children({ dialogId })}
		<div class="alert-dialog__header">
			<h2 id="{dialogId}-title" class={isDestructive ? 'text-destructive' : undefined}>
				{title ?? 'Esta acción no se puede revertir'}
			</h2>
			<p id="{dialogId}-description">
				{description ??
					'¿Estás seguro de que quieres hacer esto? Esta acción no se puede deshacer.'}
			</p>
		</div>

		{#if body}
			<div class="py-2">
				{@render body()}
			</div>
		{/if}

		<div class="alert-dialog__footer">
			<Button
				type="button"
				variant="outline"
				onclick={() => (onOpenChange ? onOpenChange(false) : (open = false))}
				disabled={isPending}
			>
				Cancelar
			</Button>

			{#if !hideProceed}
				<Button
					type="button"
					onclick={handleAction}
					class={actionClass}
					variant={isDestructive ? 'destructive' : 'default'}
					disabled={isPending || actionDisabled}
				>
					{#if isPending}
						<Spinner class="size-3.5" />
					{/if}
					Continuar
				</Button>
			{/if}
		</div>
	{/snippet}
</AlertDialog>
