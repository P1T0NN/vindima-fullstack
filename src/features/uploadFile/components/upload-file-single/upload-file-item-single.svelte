<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	// TYPES
	import type { UploadFileEntry } from '@/features/uploadFile/types/uploadFileTypes';

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

	// Existing-image entries are URL/ref strings; display their last path segment.
	const displayName = $derived(
		typeof file === 'string'
			? (decodeURIComponent(file.split('/').pop()?.split('?')[0] ?? '') || 'Imagen')
			: file.name
	);

	function replace() {
		document.getElementById(pickerInputId)?.click();
	}

	function remove() {
		selectedFile = null;
	}
</script>

<div
	class={cn(
		'border-input bg-card flex gap-3 rounded-xl border p-3 shadow-sm',
		className
	)}
>
	{#if previewUrl}
		<div class="bg-muted/40 relative size-20 shrink-0 overflow-hidden rounded-lg border">
			<img src={previewUrl} alt="" class="size-full object-cover" draggable="false" />
		</div>
	{:else}
		<div
			class="bg-muted/50 text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-lg border"
		>
			<FileTextIcon class="size-8" aria-hidden="true" />
		</div>
	{/if}

	<div class="min-w-0 flex-1 py-0.5">
		<p class="text-foreground truncate text-sm font-medium" title={displayName}>
			{displayName}
		</p>

		<p class="text-muted-foreground mt-0.5 text-xs">
			{#if typeof file === 'string'}
				Imagen existente
			{:else}
				{file.type || 'Tipo desconocido'} · {formatBytes(file.size)}
			{/if}
		</p>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" size="sm" onclick={replace}>Reemplazar</Button>

			<Button type="button" variant="destructive" size="sm" onclick={remove}>Eliminar</Button>
		</div>
	</div>
</div>
