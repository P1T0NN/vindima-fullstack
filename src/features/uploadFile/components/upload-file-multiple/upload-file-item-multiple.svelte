<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import XIcon from '@lucide/svelte/icons/x';

	type Props = {
		class?: string;
		file: File;
		index: number;
		files?: File[];
		selectedFile?: File | null;
		previewUrl?: string | null;
	};

	let {
		class: className,
		file,
		index,
		files = $bindable<File[]>([]),
		selectedFile = $bindable<File | null>(null),
		previewUrl = null
	}: Props = $props();

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

		<div class="absolute end-1.5 top-1.5">
			<Button
				type="button"
				variant="destructive"
				size="icon-sm"
				class="shadow-md"
				onclick={remove}
				aria-label={`Remove ${file.name}`}
			>
				<XIcon class="size-3.5" aria-hidden="true" />
			</Button>
		</div>
	</div>

	<div class="space-y-0.5 px-2.5 py-2">
		<p class="truncate text-xs font-medium text-foreground" title={file.name}>
			{file.name}
		</p>

		<p class="text-[0.65rem] leading-tight text-muted-foreground">
			{file.type || 'Unknown'} · {formatBytes(file.size)}
		</p>
	</div>
</div>
