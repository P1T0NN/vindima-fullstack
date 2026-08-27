<script lang="ts">
	// COMPONENTS
	import FormField from './form-field.svelte';
	import UploadFile from '@/features/uploadFile/components/upload-file.svelte';

	// TYPES
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';
	import type { UploadField } from './formTypes.js';

	type Props = {
		field: UploadField;
		uploadFiles?: PreviewFile[];
		submitting?: boolean;
	};

	let { field, uploadFiles = $bindable<PreviewFile[]>([]), submitting = false }: Props = $props();
</script>

<FormField {field} disabled={submitting || field.disabled}>
	<UploadFile
		id={field.name}
		name={field.name}
		accept={field.accept}
		allowMultiple={field.mode === 'multiple'}
		bind:files={uploadFiles}
		disabled={submitting || field.disabled}
	/>
</FormField>
