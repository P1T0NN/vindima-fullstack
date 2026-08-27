<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	let {
		onAdd,
		accept = 'image/*',
		allowMultiple = false,
		name,
		id,
		disabled = false,
		class: className,
		inputRef = $bindable<HTMLInputElement | null>(null)
	}: {
		/** Called with the picked or dropped files. */
		onAdd: (files: FileList | null) => void;
		accept?: string;
		allowMultiple?: boolean;
		/** Field name for the input — `[]` is appended when multiple. Omit to keep files out of the submission. */
		name?: string;
		id?: string;
		disabled?: boolean;
		class?: string;
		inputRef?: HTMLInputElement | null;
	} = $props();

	let dragging = $state(false);

	const openPicker = () => {
		if (!disabled) inputRef?.click();
	};

	// the dropzone is a `role="button"` — Enter/Space must work like a native button
	const onKeydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			openPicker();
		}
	};

	const onDragOver = (e: DragEvent) => e.preventDefault();

	const onDragEnter = (e: DragEvent) => {
		e.preventDefault();
		dragging = true;
	};

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault();
		// ignore dragleave fired when moving over nested content
		// SAFETY: drag events fire on the dropzone element, so currentTarget is
		// the dropzone (an HTMLElement) and relatedTarget is a DOM node or null.
		if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) dragging = false;
	};

	const onDrop = (e: DragEvent) => {
		e.preventDefault();
		dragging = false;
		onAdd(e.dataTransfer?.files ?? null);
	};

	const onSelect = (e: Event) => {
		// SAFETY: change events only fire on the file input inside this component.
		const input = e.currentTarget as HTMLInputElement;
		onAdd(input.files);
		input.value = '';
	};
</script>

<div
	class={cn(
		'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
		dragging
			? 'border-primary bg-primary/5'
			: 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/60',
		disabled && 'pointer-events-none opacity-50',
		className
	)}
	role="button"
	tabindex={disabled ? -1 : 0}
	aria-disabled={disabled}
	onclick={openPicker}
	onkeydown={onKeydown}
	ondragover={onDragOver}
	ondragenter={onDragEnter}
	ondragleave={onDragLeave}
	ondrop={onDrop}
>
	<input
		bind:this={inputRef}
		{id}
		type="file"
		{accept}
		name={name ? (allowMultiple ? `${name}[]` : name) : undefined}
		multiple={allowMultiple}
		{disabled}
		class="sr-only"
		tabindex="-1"
		onchange={onSelect}
	/>
	<span class="icon-[lucide--upload] size-6 text-muted-foreground"></span>
	<span class="text-sm font-medium">Click or drag &amp; drop</span>
	<span class="text-xs text-muted-foreground">
		{#if allowMultiple}
			Add one or more images
		{:else}
			Add one image
		{/if}
	</span>
</div>
