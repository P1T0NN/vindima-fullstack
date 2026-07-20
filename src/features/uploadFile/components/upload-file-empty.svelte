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
		'border-input bg-muted/15 hover:bg-muted/25 focus-within:ring-ring/50 block cursor-pointer rounded-xl border border-dashed p-6 transition-colors outline-none focus-within:ring-[3px]',
		dragOver && 'border-primary/60 bg-primary/5 ring-primary/20 ring-[3px]',
		invalid && !dragOver && 'border-destructive bg-destructive/5 ring-destructive/20 ring-[3px]',
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
			class="bg-background text-muted-foreground ring-border inline-flex size-11 items-center justify-center rounded-full shadow-sm ring-1"
		>
			<UploadIcon class="size-5" aria-hidden="true" />
		</span>
		<div class="space-y-0.5">
			<p class="text-foreground text-sm font-medium">
				<span class="text-primary">{multipleFiles ? 'Elige archivos' : 'Elige un archivo'}</span>
				<span class="text-muted-foreground font-normal">
					{multipleFiles ? 'o arrástralos aquí' : 'o arrástralo aquí'}
				</span>
			</p>
			{#if accept}
				<p class="text-muted-foreground text-xs">Formatos aceptados: {accept}</p>
			{/if}
		</div>
	</div>
</label>
