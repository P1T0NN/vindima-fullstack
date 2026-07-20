<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '@/components/ui/alert-dialog';

	// LUCIDE ICONS
	import { Loader } from '@lucide/svelte';

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

<AlertDialog bind:open {onOpenChange}>
	<AlertDialogTrigger class={triggerClass}>
		{@render triggerChildren?.()}
	</AlertDialogTrigger>

	<AlertDialogContent class={isDestructive ? 'ring-destructive/30' : ''}>
		<AlertDialogHeader>
			<AlertDialogTitle class={isDestructive ? 'text-destructive' : ''}>
				{title ?? 'Action cannot be reversed'}
			</AlertDialogTitle>
			<AlertDialogDescription>
				{description ?? 'Are you sure you want to do this? This action cannot be undone.'}
			</AlertDialogDescription>
		</AlertDialogHeader>

		{#if body}
			<div class="py-2">
				{@render body()}
			</div>
		{/if}

		<AlertDialogFooter>
			<AlertDialogCancel
				type="button"
				onclick={() => (onOpenChange ? onOpenChange(false) : (open = false))}
				disabled={isPending}
			>
				Cancel
			</AlertDialogCancel>

			{#if !hideProceed}
				<AlertDialogAction
					type="button"
					onclick={handleAction}
					class={actionClass}
					variant={isDestructive ? 'destructive' : 'default'}
					disabled={isPending || actionDisabled}
				>
					{#if isPending}
						<Loader class="h-3 w-3 animate-spin" />
					{/if}
					Proceed
				</AlertDialogAction>
			{/if}
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
