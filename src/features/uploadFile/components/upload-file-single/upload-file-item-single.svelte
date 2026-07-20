<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import FileTextIcon from '@lucide/svelte/icons/file-text';

	type Props = {
		class?: string;
		file: File;
		files?: File[];
		selectedFile?: File | null;
		pickerInputId: string;
		previewUrl?: string | null;
	};

	let {
		class: className,
		file,
		files = $bindable<File[]>([]),
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
		<p class="truncate text-sm font-medium text-foreground" title={file.name}>
			{file.name}
		</p>

		<p class="mt-0.5 text-xs text-muted-foreground">
			{file.type || 'Unknown type'} · {formatBytes(file.size)}
		</p>

		<div class="mt-3 flex flex-wrap items-center gap-2">
			<Button type="button" variant="outline" size="sm" onclick={replace}>Replace</Button>

			<Button type="button" variant="destructive" size="sm" onclick={remove}>Remove</Button>
		</div>
	</div>
</div>
