<script lang="ts">
	// COMPONENTS
	import UploadFileItemMultiple from './upload-file-item-multiple.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { previewKey } from '@/features/uploadFile/utils/useFileUpload.svelte';

	// TYPES
	import type { UploadFileEntry, UploadFileRow } from '@/features/uploadFile/types/uploadFileTypes';

	type Props = {
		rows: UploadFileRow[];
		files?: UploadFileEntry[];
		selectedFile?: File | null;
		onDragOver?: (e: DragEvent) => void;
		onDrop?: (e: DragEvent) => void;
		hasCoverImage?: boolean;
		class?: string;
	};

	let {
		rows,
		files = $bindable<UploadFileEntry[]>([]),
		selectedFile = $bindable<File | null>(null),
		onDragOver,
		onDrop,
		hasCoverImage = false,
		class: className
	}: Props = $props();
</script>

<!-- Input lives on `UploadFileEmpty`; this region only lists previews + accepts drops. -->
<div
	class={cn('grid grid-cols-2 gap-3 sm:grid-cols-3', className)}
	role="region"
	aria-label="Archivos seleccionados"
	aria-live="polite"
	ondragover={onDragOver}
	ondrop={onDrop}
>
	{#each rows as row (previewKey(row.file, row.index))}
		<UploadFileItemMultiple
			file={row.file}
			index={row.index}
			bind:files
			bind:selectedFile
			previewUrl={row.previewUrl}
			{hasCoverImage}
		/>
	{/each}
</div>
