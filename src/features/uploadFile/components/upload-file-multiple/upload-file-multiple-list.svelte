<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import UploadFileItemMultiple from './upload-file-item-multiple.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { UploadFileRow } from '@/features/uploadFile/types/uploadFileTypes';

	type Props = {
		rows: UploadFileRow[];
		files?: File[];
		selectedFile?: File | null;
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
		class?: string;
	};

	let {
		rows,
		files = $bindable<File[]>([]),
		selectedFile = $bindable<File | null>(null),
		onDragOver,
		onDrop,
		class: className
	}: Props = $props();
</script>

<!-- Input lives on `UploadFileEmpty`; this region only lists previews + accepts drops. -->
<div
	class={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}
	role="region"
	aria-label="Uploaded files. Drop more files here to add."
	aria-live="polite"
	ondragover={onDragOver}
	ondrop={onDrop}
>
	{#each rows as row (`${row.file.name}-${row.file.size}-${row.file.lastModified}-${row.index}`)}
		<UploadFileItemMultiple
			file={row.file}
			index={row.index}
			bind:files
			bind:selectedFile
			previewUrl={row.previewUrl}
		/>
	{/each}
</div>
