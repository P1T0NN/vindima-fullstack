<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	// TYPES
	import type { UploadFileEntry } from '@/features/uploadFile/types/uploadFileTypes';
	import { uploadImageName } from '@/features/uploadFile/utils/uploadImageUtils';

	type Props = {
		class?: string;
		file: UploadFileEntry;
		files?: UploadFileEntry[];
		selectedFile?: File | null;
		pickerInputId: string;
		previewUrl?: string | null;
	};

	let {
		class: className,
		file,
		files = $bindable<UploadFileEntry[]>([]),
		selectedFile = $bindable<File | null>(null),
		pickerInputId,
		previewUrl = null
	}: Props = $props();

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'] as const;
		const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(i > 0 ? 1 : 0))} ${sizes[i]}`;
	}

	const displayName = $derived(uploadImageName(file));

	function replace() {
		document.getElementById(pickerInputId)?.click();
	}

	function remove() {
		selectedFile = null;
	}
</script>

<div class={cn('flex gap-3 rounded-xl border border-input bg-card p-3 shadow-sm', className)}>
	{#if previewUrl}
		<div class="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted/40">
			<img src={previewUrl} alt="" class="size-full object-cover" draggable="false" />
		</div>
	{:else}
		<div
			class="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-muted/50 text-muted-foreground"
		>
			<FileTextIcon class="size-8" aria-hidden="true" />
		</div>
	{/if}

	<div class="min-w-0 flex-1 py-0.5">
		<p class="truncate text-sm font-medium text-foreground" title={displayName}>
			{displayName}
		</p>

		<p class="mt-0.5 text-xs text-muted-foreground">
			{#if typeof file === 'string'}
				Imagen existente
			{:else}
				{file.type || 'Tipo desconocido'} - {formatBytes(file.size)}
			{/if}
		</p>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" size="sm" onclick={replace}>Reemplazar</Button>

			<Button type="button" variant="destructive" size="sm" onclick={remove}>Eliminar</Button>
		</div>
	</div>
</div>
