<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import StarIcon from '@lucide/svelte/icons/star';
	import XIcon from '@lucide/svelte/icons/x';

	// TYPES
	import type { UploadFileEntry } from '@/features/uploadFile/types/uploadFileTypes';
	import { uploadImageName } from '@/features/uploadFile/utils/uploadImageUtils';

	type Props = {
		class?: string;
		file: UploadFileEntry;
		index: number;
		files?: UploadFileEntry[];
		selectedFile?: File | null;
		previewUrl?: string | null;
		hasCoverImage?: boolean;
	};

	let {
		class: className,
		file,
		index,
		files = $bindable<UploadFileEntry[]>([]),
		selectedFile = $bindable<File | null>(null),
		previewUrl = null,
		hasCoverImage = false
	}: Props = $props();

	// ponytail: cover image is always files[0] — starring moves the file to the front,
	// so removal/reorder needs no separate cover state.
	const isCover = $derived(hasCoverImage && index === 0);

	const displayName = $derived(uploadImageName(file));

	function setAsCover() {
		files = [file, ...files.filter((_, j) => j !== index)];
	}

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'] as const;
		const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
	}

	function remove() {
		files = files.filter((_, j) => j !== index);
	}
</script>

<div
	class={cn(
		'group/item relative overflow-hidden rounded-xl border border-input bg-card shadow-sm',
		className
	)}
>
	<div class="relative aspect-square max-h-56 w-full bg-muted/30">
		{#if previewUrl}
			<img src={previewUrl} alt="" class="size-full object-cover" draggable="false" />
		{:else}
			<div class="flex size-full items-center justify-center text-muted-foreground">
				<FileTextIcon class="size-12" aria-hidden="true" />
			</div>
		{/if}

		{#if hasCoverImage}
			<div class="absolute start-1.5 top-1.5">
				{#if isCover}
					<span
						class="flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 text-[0.65rem] font-medium text-primary-foreground shadow-md"
					>
						<StarIcon class="size-3.5 fill-current" aria-hidden="true" />
						Portada
					</span>
				{:else}
					<Button
						type="button"
						variant="secondary"
						size="icon-sm"
						class="shadow-md"
						onclick={setAsCover}
						aria-label={`Establecer ${displayName} como portada`}
					>
						<StarIcon class="size-3.5" aria-hidden="true" />
					</Button>
				{/if}
			</div>
		{/if}

		<div class="absolute end-1.5 top-1.5">
			<Button
				type="button"
				variant="destructive"
				size="icon-sm"
				class="shadow-md"
				onclick={remove}
				aria-label={`Eliminar ${displayName}`}
			>
				<XIcon class="size-3.5" aria-hidden="true" />
			</Button>
		</div>
	</div>

	<div class="space-y-0.5 px-2.5 py-2">
		<p class="truncate text-xs font-medium text-foreground" title={displayName}>
			{displayName}
		</p>

		<p class="text-[0.65rem] leading-tight text-muted-foreground">
			{#if typeof file === 'string'}
				Imagen existente
			{:else}
				{file.type || 'Tipo desconocido'} - {formatBytes(file.size)}
			{/if}
		</p>
	</div>
</div>
