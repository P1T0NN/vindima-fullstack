<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	type Props = {
		count: number;
		onClear: () => void;
		class?: string;
		/** Render built-in bulk-action buttons (currently: Delete). */
		withActionButtons?: boolean;
		/** Passed to the Delete button; required when `withActionButtons` is on. */
		deleteFunction?: () => Promise<void> | void;
		/** Forwards to the Delete button's AlertDialog confirm action (spinner + disable). */
		isDeleting?: boolean;
	};

	let {
		count,
		onClear,
		class: className,
		withActionButtons = true,
		deleteFunction,
		isDeleting = false
	}: Props = $props();

	const canRenderDelete = $derived(withActionButtons && typeof deleteFunction === 'function');
</script>

<div
	role="status"
	aria-live="polite"
	class={cn(
		'flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2',
		className
	)}
>
	<div class="flex min-w-0 items-center gap-2">
		<span
			class="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary"
			aria-hidden="true"
		>
			<CheckIcon class="size-3.5" />
		</span>

		<span class="truncate text-sm font-medium text-foreground tabular-nums">
			{count === 1 ? '1 seleccionado' : `${count} seleccionados`}
		</span>
	</div>

	<div class="flex shrink-0 items-center gap-2">
		{#if canRenderDelete && deleteFunction}
			<ActionButton function={deleteFunction} variant="destructive" isPending={isDeleting}>
				<Trash2Icon />
				<span>Eliminar</span>
				{#if count > 0}
					<span class="tabular-nums opacity-80">({count})</span>
				{/if}
			</ActionButton>
		{/if}
		<Button type="button" variant="ghost" size="sm" disabled={isDeleting} onclick={onClear}>
			Limpiar
		</Button>
	</div>
</div>
