<script lang="ts">
	// COMPONENTS
	import UploadFileEmpty from '../upload-file-empty.svelte';
	import UploadFileMultipleList from './upload-file-multiple-list.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { useFileUpload } from '../../utils/useFileUpload.svelte';

	type Props = {
		class?: string;
		/** Cleared in multi mode; kept bindable for parity with single. */
		file?: File | null;
		files?: File[];
		accept?: string;
		disabled?: boolean;
		id?: string;
	};

	let {
		class: className,
		file = $bindable<File | null>(null),
		files = $bindable<File[]>([]),
		accept,
		disabled = false,
		id: inputId
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
			/>
		{/if}
	</div>
</div>
