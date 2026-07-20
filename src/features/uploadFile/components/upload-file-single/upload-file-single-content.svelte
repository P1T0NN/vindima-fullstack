<script lang="ts">
	// COMPONENTS
	import UploadFileItemSingle from './upload-file-item-single.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { previewKey } from '@/features/uploadFile/utils/useFileUpload.svelte';

	// TYPES
	import type { UploadFileEntry, UploadFileRow } from '@/features/uploadFile/types/uploadFileTypes';

	type Props = {
		rows: UploadFileRow[];
		pickerInputId: string;
		accept?: string;
		disabled?: boolean;
		files?: UploadFileEntry[];
		selectedFile?: File | null;
		fileInputRef?: HTMLInputElement | null;
		onFileInputChange?: (e: Event) => void;
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
		class?: string;
	};

	let {
		rows,
		pickerInputId,
		accept,
		disabled = false,
		files = $bindable<UploadFileEntry[]>([]),
		selectedFile = $bindable<File | null>(null),
		fileInputRef = $bindable<HTMLInputElement | null>(null),
		onFileInputChange,
		onDragOver,
		onDrop,
		class: className
	}: Props = $props();
</script>

<input
	id={pickerInputId}
	bind:this={fileInputRef}
	type="file"
	class="sr-only"
	{accept}
	{disabled}
	multiple={false}
	onchange={onFileInputChange}
/>

<div
	class={cn('flex flex-col gap-3', className)}
	role="region"
	aria-label="Archivo seleccionado"
	aria-live="polite"
	ondragover={onDragOver}
	ondrop={onDrop}
>
	{#each rows as row (previewKey(row.file, row.index))}
		<UploadFileItemSingle
			file={row.file}
			bind:files
			bind:selectedFile
			pickerInputId={pickerInputId}
			previewUrl={row.previewUrl}
		/>
	{/each}
</div>
