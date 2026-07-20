<script lang="ts">
	import UploadFileSingle from '@/features/uploadFile/components/upload-file-single/upload-file-single.svelte';
	import UploadFileMultiple from '@/features/uploadFile/components/upload-file-multiple/upload-file-multiple.svelte';
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue,
		invalid = false
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
		/** Schema validation failed for this field — paints the dropzone destructive. */
		invalid?: boolean;
	} = $props();
</script>

{#if field.kind === 'upload-single'}
	<UploadFileSingle
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		{invalid}
		bind:file={() => (value as File | null) ?? null, (v) => setValue(v)}
	/>
{:else if field.kind === 'upload-multiple'}
	<UploadFileMultiple
		id={inputId}
		accept={field.accept}
		disabled={field.disabled}
		hasCoverImage={field.hasCoverImage}
		{invalid}
		bind:files={() => (value as (File | string)[]) ?? [], (v) => setValue(v)}
	/>
{/if}
