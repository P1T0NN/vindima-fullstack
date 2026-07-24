<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import UploadIcon from '@lucide/svelte/icons/upload';

	type Props = {
		class?: string;
		pickerInputId: string;
		accept?: string;
		disabled?: boolean;
		multipleFiles?: boolean;
		dragOver?: boolean;
		/** Validation failed for this field — paints the dropzone destructive. */
		invalid?: boolean;
		fileInputRef?: HTMLInputElement | null;
		onFileInputChange?: (e: Event) => void;
		onDragEnter?: (e: DragEvent) => void;
		onDragLeave?: (e: DragEvent) => void;
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
	};

	let {
		class: className,
		pickerInputId,
		accept,
		disabled = false,
		multipleFiles = false,
		dragOver = false,
		invalid = false,
		fileInputRef = $bindable<HTMLInputElement | null>(null),
		onFileInputChange,
		onDragEnter,
		onDragLeave,
		onDragOver,
		onDrop
	}: Props = $props();
</script>

<label
	data-invalid={invalid ? 'true' : undefined}
	class={cn(
		'block cursor-pointer rounded-xl border border-dashed border-input bg-muted/15 p-6 transition-colors outline-none focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-muted/25',
		dragOver && 'border-primary/60 bg-primary/5 ring-[3px] ring-primary/20',
		invalid && !dragOver && 'border-destructive bg-destructive/5 ring-[3px] ring-destructive/20',
		className
	)}
	ondragenter={onDragEnter}
	ondragleave={onDragLeave}
	ondragover={onDragOver}
	ondrop={onDrop}
>
	<input
		id={pickerInputId}
		bind:this={fileInputRef}
		type="file"
		class="sr-only"
		{accept}
		{disabled}
		multiple={multipleFiles}
		onchange={onFileInputChange}
	/>
	<div class="pointer-events-none flex flex-col items-center gap-2 text-center">
		<span
			class="inline-flex size-11 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border"
		>
			<UploadIcon class="size-5" aria-hidden="true" />
		</span>
		<div class="space-y-0.5">
			<p class="text-sm font-medium text-foreground">
				<span class="text-primary">
					{#if multipleFiles}Elige archivos{:else}Elige un archivo{/if}
				</span>
				<span class="font-normal text-muted-foreground">
					{#if multipleFiles}o arrástralos aquí{:else}o arrástralo aquí{/if}
				</span>
			</p>
			{#if accept}
				<p class="text-xs text-muted-foreground">Formatos aceptados: {accept}</p>
			{/if}
		</div>
	</div>
</label>
