<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	let {
		preview,
		index,
		total,
		allowMultiple = false,
		onRemove,
		onMove,
		onSetCover,
		class: className
	}: {
		preview: PreviewFile;
		index: number;
		total: number;
		allowMultiple?: boolean;
		onRemove: (index: number) => void;
		onMove: (index: number, direction: -1 | 1) => void;
		onSetCover: (index: number) => void;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'relative aspect-square overflow-hidden rounded-lg border border-border bg-muted',
		className
	)}
>
	{#if !preview.file || preview.file.type.startsWith('image/')}
		<img
			src={preview.url}
			alt={preview.file?.name ?? 'Uploaded image'}
			class="h-full w-full object-cover"
		/>
	{:else}
		<div class="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
			<span class="icon-[lucide--file] size-8 text-muted-foreground"></span>
			<span class="line-clamp-2 text-xs text-muted-foreground">{preview.file.name}</span>
		</div>
	{/if}

	{#if index === 0}
		<span
			title="Cover image"
			class="absolute top-1.5 left-1.5 flex items-center justify-center rounded-sm bg-yellow-400 p-1 shadow-sm"
		>
			<span class="icon-[lucide--star] size-3.5 text-yellow-950"></span>
		</span>
	{:else if allowMultiple}
		<button
			type="button"
			title="Set as cover"
			class="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
			onclick={() => onSetCover(index)}
		>
			<span class="icon-[lucide--star] size-3"></span>
			Cover
		</button>
	{/if}

	<button
		type="button"
		title="Remove"
		class="absolute top-1.5 right-1.5 flex items-center justify-center rounded-full bg-destructive/10 p-1 text-destructive shadow-sm backdrop-blur transition-colors hover:bg-destructive/20"
		onclick={() => onRemove(index)}
	>
		<span class="icon-[lucide--x] size-3.5"></span>
	</button>

	{#if allowMultiple}
		<button
			type="button"
			title="Move left"
			disabled={index === 0}
			class="absolute bottom-1.5 left-1.5 flex items-center justify-center rounded-full bg-background/80 p-1 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40"
			onclick={() => onMove(index, -1)}
		>
			<span class="icon-[lucide--arrow-left] size-3.5"></span>
		</button>
		<button
			type="button"
			title="Move right"
			disabled={index === total - 1}
			class="absolute right-1.5 bottom-1.5 flex items-center justify-center rounded-full bg-background/80 p-1 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-40"
			onclick={() => onMove(index, 1)}
		>
			<span class="icon-[lucide--arrow-right] size-3.5"></span>
		</button>
	{/if}
</div>
