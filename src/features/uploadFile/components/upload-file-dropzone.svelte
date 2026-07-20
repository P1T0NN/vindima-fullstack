<script lang="ts">
	// COMPONENTS
	import UploadFileMultipleDropzone from './upload-file-multiple/upload-file-multiple-dropzone.svelte';
	import UploadFileSingleDropzone from './upload-file-single/upload-file-single-dropzone.svelte';

	type Props = {
		multipleFiles: boolean;
	};

	let { multipleFiles }: Props = $props();
</script>

{#if multipleFiles}
	<UploadFileMultipleDropzone />
{:else}
	<UploadFileSingleDropzone />
{/if}
