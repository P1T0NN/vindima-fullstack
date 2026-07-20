<script lang="ts">
	// COMPONENTS
	import AlertDialogButton from '@/components/ui/alert-dialog-button/alert-dialog-button.svelte';
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant
	} from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	type Props = {
		/** Confirmed-action handler. Invoked after the user clicks the dialog's confirm button. */
		function: () => Promise<void> | void;
		/** Trigger content (icon, label, count, etc.). */
		children: import('svelte').Snippet;
		/** Button variant applied to the trigger button. */
		variant?: ButtonVariant;
		/** Trigger button size. */
		size?: ButtonSize;
		class?: string;
		/** Shows a spinner on the confirm action and disables it while the action is running. */
		isPending?: boolean;
		/** When true, renders the confirm action as disabled. Use for form-validity / typed-confirm gates. */
		actionDisabled?: boolean;
		/** When true, the dialog gets destructive styling (red-tinted title, destructive action button). */
		isDestructive?: boolean;
		/** When true, the proceed/action button is hidden — only the cancel button remains. */
		hideProceed?: boolean;
		/** Dialog copy overrides; fall back to AlertDialogButton defaults. */
		title?: string;
		description?: string;
		/** Optional form fields or context rendered between the description and the footer. */
		body?: import('svelte').Snippet;
	};

	let {
		function: actionFunction,
		children,
		variant = 'default',
		size = 'sm',
		class: className,
		isPending = false,
		actionDisabled = false,
		isDestructive = false,
		hideProceed = false,
		title,
		description,
		body
	}: Props = $props();

	const triggerClass = $derived(cn(buttonVariants({ variant, size }), className));
	const actionClass = $derived(
		buttonVariants({ variant: isDestructive ? 'destructive' : 'default' })
	);
</script>

<AlertDialogButton
	function={actionFunction}
	{isPending}
	{actionDisabled}
	{isDestructive}
	{hideProceed}
	{title}
	{description}
	{triggerClass}
	{actionClass}
	{body}
>
	{#snippet triggerChildren()}
		{@render children()}
	{/snippet}
</AlertDialogButton>
