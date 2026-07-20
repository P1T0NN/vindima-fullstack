<script lang="ts">
	import UploadFileSingle from '@/features/uploadFile/components/upload-file-single/upload-file-single.svelte';
	import UploadFileMultiple from '@/features/uploadFile/components/upload-file-multiple/upload-file-multiple.svelte';
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
	} = $props();
</script>

{#if field.kind === 'upload-single'}
	<UploadFileSingle
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		bind:file={() => (value as File | null) ?? null, (v) => setValue(v)}
	/>
{:else if field.kind === 'upload-multiple'}
	<UploadFileMultiple
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		bind:files={() => (value as File[]) ?? [], (v) => setValue(v)}
	/>
{/if}
