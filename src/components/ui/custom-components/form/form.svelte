<script lang="ts" generics="Mutation extends FunctionReference<'mutation'>">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { api } from '@convex/_generated/api';

	// COMPONENTS
	import FormCheckbox from './form-checkbox.svelte';
	import FormInput from './form-input.svelte';
	import FormSection from './form-section.svelte';
	import FormSelect from './form-select.svelte';
	import FormTextarea from './form-textarea.svelte';
	import FormUploadFile from './form-upload-file.svelte';

	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import { STORAGE_CONFIG } from '@/shared/features/storage/config.js';
	import { optimizeToWebp } from '@/features/storage/utils/optimizeToWebp.js';

	// TYPES
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';
	import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
	import type { FieldConfig, FormFieldContext, FormFieldValue } from './formTypes.js';
	import type { PreviewFile } from '@/features/uploadFile/types/uploadFileTypes.js';

	type MutationValue = FunctionArgs<Mutation>[keyof FunctionArgs<Mutation>];
	type FormValue = MutationValue | FormFieldValue;
	type MutationValues = Partial<Omit<FunctionArgs<Mutation>, 'uploadedFiles' | 'retainedFiles'>> &
		Record<string, FormValue | undefined>;
	type UploadPrepareContext = {
		values: MutationValues;
		uploadedFiles: string[];
		retainedFiles: string[];
		uploadFiles: PreviewFile[];
	};
	type PreparedMutationArgs = Omit<FunctionArgs<Mutation>, 'uploadedFiles' | 'retainedFiles'>;
	type ExtraFieldsContext = FormFieldContext<FormValue>;
	type Props = Omit<WithElementRef<HTMLAttributes<HTMLFormElement>>, 'onsubmit'> & {
		/** Convex mutation reference run with the current values. */
		function: Mutation;
		/** Field presentation config (kinds, labels, placeholders). */
		fields?: FieldConfig[];
		/** Custom fields rendered after `fields`, with access to shared form values. */
		extraFields?: Snippet<[ExtraFieldsContext]>;
		/** Called with the mutation result after a successful submit. */
		onSuccess?: (result: FunctionReturnType<Mutation>) => void | Promise<void>;
		/** Toast text after the mutation resolves. */
		successMessage?: string;
		/** Toast fallback for non-rate-limit mutation or upload errors. */
		errorMessage?: string;
		/** Reset values and selected files after a successful submit. */
		resetOnSuccess?: boolean;
		/** Selected files for the upload component. */
		uploadFiles?: PreviewFile[];
		/** Server-generated R2 key namespace, such as `products` or `categories/images`. */
		uploadNamespace?: string;
		/** Map values and completed uploads to the mutation's domain arguments. */
		prepareArgs?: (context: UploadPrepareContext) => PreparedMutationArgs;
		/** Mutation values by argument name; fields update this object directly. */
		values?: MutationValues;
		/** In-flight flag for the mutation and upload workflow. */
		submitting?: boolean;
		children?: Snippet;
	};

	let {
		function: convexFunction,
		fields = [],
		extraFields,
		onSuccess,
		successMessage = 'Saved successfully.',
		errorMessage = 'Something went wrong.',
		resetOnSuccess = true,
		uploadFiles = $bindable<PreviewFile[]>([]),
		uploadNamespace,
		prepareArgs,
		values = $bindable<MutationValues>({}),
		submitting = $bindable(false),
		id,
		class: className,
		children,
		...restProps
	}: Props = $props();

	const hasUploadField = (fieldList: FieldConfig[]): boolean => {
		for (const field of fieldList) {
			if (field.kind === 'upload') return true;
			if (field.kind === 'section') {
				if (hasUploadField(field.fields)) return true;
			}
		}
		return false;
	};

	const uploadEnabled = $derived(hasUploadField(fields));
	const mutation = $derived(useMutation(convexFunction));

	const generateUploadUrl = useMutation(api.storage.r2.generateUploadUrl);
	const syncUploadMetadata = useMutation(api.storage.r2.syncMetadata);
	const deleteUpload = useMutation(api.storage.r2.deleteObject);

	// Sections have no name; leaves use their field name.
	const fieldKey = (field: FieldConfig, index: number) =>
		field.kind === 'section' ? 'section-' + index : field.name;

	const setLocalValue = (name: string, value: FormValue | undefined) => {
		values = { ...values, [name]: value };
	};
	const localInputValue = (name: string) => {
		const value = values[name];
		return value === undefined ? '' : String(value);
	};
	const localCheckboxValue = (name: string) => values[name] === true;
	const extraFieldsContext = $derived<ExtraFieldsContext>({
		values,
		getValue: (name) => values[name],
		setValue: setLocalValue,
		inputValue: localInputValue,
		checkboxValue: localCheckboxValue,
		disabled: submitting
	});

	const removeUploads = async (keys: string[]): Promise<void> => {
		await Promise.allSettled(keys.map((key) => deleteUpload({ key })));
	};

	const uploadFile = async (file: File): Promise<string> => {
		const upload = await generateUploadUrl(uploadNamespace ? { namespace: uploadNamespace } : {});
		try {
			const response = await fetch(upload.url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file
			});
			if (!response.ok) throw new Error(`Failed to upload file: ${response.statusText}`);
			await syncUploadMetadata({ key: upload.key });
			return upload.key;
		} catch (error) {
			await deleteUpload({ key: upload.key }).catch(() => {});
			throw error;
		}
	};

	const uploadSelectedFiles = async (): Promise<string[]> => {
		if (uploadFiles.length > STORAGE_CONFIG.maxFilesPerUpload) {
			throw new Error(`You can upload at most ${STORAGE_CONFIG.maxFilesPerUpload} files`);
		}
		const localFiles = uploadFiles.flatMap((preview) => (preview.file ? [preview.file] : []));
		const files = await Promise.all(
			localFiles.map(async (file) => {
				if (!file.type.startsWith('image/')) return file;
				return optimizeToWebp(file).catch(() => file);
			})
		);

		const results = await Promise.allSettled(files.map((file) => uploadFile(file)));
		const keys = results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
		const failed = results.find((result) => result.status === 'rejected');
		if (failed) {
			await removeUploads(keys);
			throw failed.reason;
		}
		return keys;
	};

	async function handleFunctionSubmitted(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	): Promise<void> {
		event.preventDefault();
		if (submitting) return;

		const formElement = event.currentTarget;
		let uploadedFiles: string[] = [];
		let retainedFiles: string[] = [];
		let result: FunctionReturnType<Mutation>;

		submitting = true;
		try {
			if (uploadEnabled) {
				retainedFiles = uploadFiles.flatMap((preview) => (preview.key ? [preview.key] : []));
				if (uploadFiles.some((preview) => preview.file)) {
					uploadedFiles = await uploadSelectedFiles();
				}
			}
			const preparedArgs = prepareArgs?.({
				values: { ...values },
				uploadedFiles,
				retainedFiles,
				uploadFiles: [...uploadFiles]
			}) ?? { ...values };
			const mutationArgs = uploadEnabled
				? {
						...preparedArgs,
						retainedFiles
					}
				: preparedArgs;
			if (uploadEnabled && uploadedFiles.length > 0) {
				Object.assign(mutationArgs, { uploadedFiles });
			}
			// SAFETY: fields write directly into the function-derived values object;
			// native validation runs first and Convex validators remain authoritative.
			result = await mutation(mutationArgs as FunctionArgs<Mutation>);
		} catch (error) {
			await removeUploads(uploadedFiles);
			toastMessage({ type: 'error', error, message: errorMessage });
			return;
		} finally {
			submitting = false;
		}

		if (resetOnSuccess) {
			formElement.reset();
			values = {};
			for (const file of uploadFiles) if (file.file) URL.revokeObjectURL(file.url);
			uploadFiles = [];
		}
		toastMessage({ type: 'success', message: successMessage });
		await onSuccess?.(result);
	}
</script>

{#snippet renderLocalField(field: FieldConfig)}
	{#if field.kind === 'input'}
		<FormInput
			{field}
			value={localInputValue(field.name)}
			disabled={submitting || field.disabled}
			onValueChange={(value) => setLocalValue(field.name, value)}
		/>
	{:else if field.kind === 'textarea'}
		<FormTextarea
			{field}
			value={localInputValue(field.name)}
			disabled={submitting || field.disabled}
			onValueChange={(value) => setLocalValue(field.name, value)}
		/>
	{:else if field.kind === 'select'}
		<FormSelect
			{field}
			value={localInputValue(field.name)}
			disabled={submitting || field.disabled}
			onValueChange={(value) => setLocalValue(field.name, value)}
		/>
	{:else if field.kind === 'checkbox'}
		<FormCheckbox
			{field}
			checked={localCheckboxValue(field.name)}
			disabled={submitting || field.disabled}
			onCheckedChange={(checked) => setLocalValue(field.name, checked)}
		/>
	{:else if field.kind === 'upload'}
		<FormUploadFile {field} bind:uploadFiles {submitting} />
	{:else if field.kind === 'section'}
		<FormSection {field} renderField={renderLocalField} />
	{/if}
{/snippet}

<form
	{id}
	class={cn('flex flex-col gap-6', className)}
	{...restProps}
	onsubmit={handleFunctionSubmitted}
	aria-busy={submitting}
>
	{#each fields as field, index (fieldKey(field, index))}
		{@render renderLocalField(field)}
	{/each}

	{@render extraFields?.(extraFieldsContext)}

	{@render children?.()}
</form>
