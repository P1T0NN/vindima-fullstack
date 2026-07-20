<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';
	import type { ZodIssue, ZodType } from 'zod';

	// CONFIG

	// COMPONENTS
	import MutationForm from './mutation-form.svelte';

	// UTILS
	import { safeMutation, uploadFileToR2 } from '@/utils/convexHelpers';
	import { translateFromBackend } from '@/utils/translateFromBackend';
	import { processUploadFields } from './utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FunctionReference } from 'convex/server';
	import type {
		MutationFormCustomFields,
		MutationFormExtraFieldsProps,
		MutationFormFieldDef,
		MutationFormPrepareSubmit,
		MutationFormSection,
		MutationFormSubmitHandler
	} from './types.js';

	type BackendMessage = Parameters<typeof translateFromBackend>[0];
	type MutationEnvelope = { success: boolean; message: BackendMessage };
	type ConvexFormMutation = FunctionReference<
		'mutation',
		'public',
		Record<string, unknown>,
		unknown
	>;

	let {
		fields,
		sections,
		values = $bindable(),
		initialValues,
		runFunction,
		transformArgs,
		onResult,
		schema,
		onSuccess,
		submitLabel = 'Enviar',
		resetOnSuccess = true,
		customFields,
		header,
		extraFields,
		actions,
		class: className
	}: {
		/** Flat field list. Renders as a single plain section. Mutually exclusive with `sections`. */
		fields?: MutationFormFieldDef[];
		/** Grouped sections, each rendered as a Card with a 2-col grid by default. */
		sections?: MutationFormSection[];
		values: T;
		initialValues?: T;
		runFunction: ConvexFormMutation;
		/** Reshape the flat form values into the mutation's argument shape (nesting, extra keys).
		 *  Runs after uploads, so `args` already holds storage refs. Defaults to sending `args` as-is. */
		transformArgs?: (args: Record<string, unknown>, values: T) => Record<string, unknown>;
		/** Inspect the mutation's return value. Return a boolean to take over — `true` counts as a
		 *  success (skips the default toast, `onSuccess` still runs), `false` aborts. */
		onResult?: (result: unknown) => boolean | void | Promise<boolean | void>;
		schema: ZodType<T>;
		onSuccess?: (values: T) => void;
		submitLabel?: string;
		resetOnSuccess?: boolean;
		customFields?: MutationFormCustomFields<T>;
		header?: Snippet;
		/** Rendered after the declared sections; receives the validation state so array editors
		 *  can show per-row errors (see `MutationForm`). */
		extraFields?: Snippet<[MutationFormExtraFieldsProps<T>]>;
		actions?: Snippet<[{ busy: boolean }]>;
		class?: string;
	} = $props();

	const convex = useConvexClient();

	function hasMutationEnvelope(value: unknown): value is MutationEnvelope {
		return (
			typeof value === 'object' &&
			value !== null &&
			'success' in value &&
			'message' in value &&
			typeof (value as { success: unknown }).success === 'boolean'
		);
	}

	const prepareUploads: MutationFormPrepareSubmit<T> = async ({ sections, args, progress }) => {
		return await processUploadFields({
			sections,
			args,
			progress,
			uploadOne: (file) => uploadFileToR2(convex, file)
		});
	};

	const submitMutation: MutationFormSubmitHandler<T> = async (args, values) => {
		let result: Awaited<ReturnType<typeof safeMutation>>;
		try {
			result = await safeMutation(convex, runFunction, transformArgs?.(args, values) ?? args);
		} catch (error) {
			console.error('[convex-mutation-form] submitMutation failed:', error);
			toast.error('Ocurrió un error inesperado. Inténtalo de nuevo.');
			return false;
		}

		if (!result) return false;

		const handled = await onResult?.(result);
		if (typeof handled === 'boolean') return handled;

		if (!hasMutationEnvelope(result)) return true;

		if (!result.success) {
			toast.error(translateFromBackend(result.message));
			return false;
		}

		toast.success(translateFromBackend(result.message));
		return true;
	};
</script>

<MutationForm
	{fields}
	{sections}
	bind:values
	{initialValues}
	onSubmit={submitMutation}
	prepareSubmit={prepareUploads}
	{schema}
	{onSuccess}
	{submitLabel}
	{resetOnSuccess}
	{customFields}
	{header}
	{extraFields}
	{actions}
	class={className}
/>
