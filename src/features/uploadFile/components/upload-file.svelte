<script lang="ts">
	// LIBRARIES
	import { onDestroy } from 'svelte';

	// COMPONENTS
	import UploadFileDropzone from './upload-file-dropzone.svelte';
	import UploadFilePreviewItem from './upload-file-preview-item.svelte';

	// HOOKS
	import { useUpload } from '@/features/uploadFile/hooks/useUpload.svelte.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let {
		files = $bindable<PreviewFile[]>([]),
		allowMultiple = false,
		accept = 'image/*',
		disabled = false,
		id,
		name,
		class: className
	}: {
		/** Selected files with their preview URLs — bind to read them out. */
		files?: PreviewFile[];
		/** Allow multiple files. Without it, a new selection replaces the current one. */
		allowMultiple?: boolean;
		/** Accepted file types. */
		accept?: string;
		disabled?: boolean;
		id?: string;
		name?: string;
		class?: string;
	} = $props();

	// all upload logic lives in the hook; files stays bindable, so it's bridged in
	const upload = useUpload({
		// closure so the hook reads the current prop, not the init-time snapshot
		allowMultiple: () => allowMultiple,
		files: { get: () => files, set: (value) => (files = value) }
	});

	onDestroy(upload.destroy);
</script>

<div class={cn('space-y-4', className)}>
	<UploadFileDropzone {accept} {allowMultiple} {disabled} {id} {name} onAdd={upload.addFiles} />

	{#if files.length > 0}
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{#each files as preview, index (preview.id)}
				<UploadFilePreviewItem
					{preview}
					{index}
					{allowMultiple}
					total={files.length}
					onRemove={upload.remove}
					onMove={upload.move}
					onSetCover={upload.setAsCover}
				/>
			{/each}
		</div>
	{/if}
</div>
