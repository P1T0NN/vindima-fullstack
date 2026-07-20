<script lang="ts">
	// COMPONENTS
	import UploadFileEmpty from '../upload-file-empty.svelte';
	import UploadFileMultipleList from './upload-file-multiple-list.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { useFileUpload } from '../../utils/useFileUpload.svelte';

	// TYPES
	import type { UploadFileEntry } from '@/features/uploadFile/types/uploadFileTypes';

	type Props = {
		class?: string;
		/** Cleared in multi mode; kept bindable for parity with single. */
		file?: File | null;
		/** Mixed list: picked `File`s plus existing-image URL/ref strings (edit flows). */
		files?: UploadFileEntry[];
		accept?: string;
		disabled?: boolean;
		id?: string;
		/** Show a star control on each preview; the starred image becomes `files[0]` (the cover). */
		hasCoverImage?: boolean;
		/** Validation failed for this field — paints the dropzone destructive. */
		invalid?: boolean;
	};

	let {
		class: className,
		file = $bindable<File | null>(null),
		files = $bindable<UploadFileEntry[]>([]),
		accept,
		disabled = false,
		id: inputId,
		hasCoverImage = false,
		invalid = false
	}: Props = $props();

	const pickerInputId = $derived(inputId ?? 'upload-file-input-multiple');

	const upload = useFileUpload({
		mode: 'multiple',
		getFile: () => file,
		setFile: (v) => {
			file = v;
		},
		getFiles: () => files,
		setFiles: (v) => {
			files = v;
		},
		getDisabled: () => disabled
	});
</script>

<div
	class={cn(
		'group/upload-file-multiple w-full max-w-2xl min-w-0',
		disabled && 'pointer-events-none opacity-50',
		className
	)}
	data-disabled={disabled ? 'true' : undefined}
>
	<div class="flex flex-col gap-4">
		<UploadFileEmpty
			{pickerInputId}
			{accept}
			{disabled}
			multipleFiles={true}
			dragOver={upload.dragOver}
			{invalid}
			bind:fileInputRef={upload.inputRef}
			onFileInputChange={upload.handleInputChange}
			onDragEnter={() => {
				if (!disabled) upload.dragOver = true;
			}}
			onDragLeave={() => {
				upload.dragOver = false;
			}}
			onDragOver={upload.handleDragOver}
			onDrop={upload.handleDrop}
		/>

		{#if files.length > 0}
			<UploadFileMultipleList
				rows={upload.contentRows}
				bind:files
				bind:selectedFile={file}
				onDragOver={upload.handleDragOver}
				onDrop={upload.handleDrop}
				{hasCoverImage}
			/>
		{/if}
	</div>
</div>
