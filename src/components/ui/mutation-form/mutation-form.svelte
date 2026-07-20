<script lang="ts" generics="T extends Record<string, unknown>">
	// LIBRARIES
	import { toast } from 'svelte-sonner';
	import { type ZodType } from 'zod';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardContent
	} from '@/components/ui/card/index.js';
	import {
		FieldGroup,
		Field,
		FieldSet,
		FieldLegend,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/components/ui/field/index.js';
	import InputField from './input-field.svelte';
	import TextareaField from './textarea-field.svelte';
	import SelectField from './select-field.svelte';
	import CheckboxField from './checkbox-field.svelte';
	import SwitchField from './switch-field.svelte';
	import RadioGroupField from './radio-group-field.svelte';
	import UploadField from './upload-field.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
	import { useProgress } from '@/features/uploadFile/utils/useProgress.svelte';
	import { Progress } from '@/components/ui/progress/index.js';
	import { hasUploadFields } from './utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { ZodIssue } from 'zod';
	import type {
		MutationFormCustomFields,
		MutationFormExtraFieldsProps,
		MutationFormFieldDef,
		MutationFormFieldErrors,
		MutationFormPrepareSubmit,
		MutationFormSection,
		MutationFormSubmitHandler
	} from './types.js';

	let {
		fields,
		sections,
		values = $bindable(),
		initialValues,
		onSubmit,
		prepareSubmit,
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
		onSubmit: MutationFormSubmitHandler<T>;
		prepareSubmit?: MutationFormPrepareSubmit<T>;
		schema: ZodType<T>;
		onSuccess?: (values: T) => void;
		submitLabel?: string;
		resetOnSuccess?: boolean;
		customFields?: MutationFormCustomFields<T>;
		header?: Snippet;
		/** Rendered after the declared sections (array editors, custom blocks). Receives the
		 *  validation state so those blocks can show their own errors: `errors` keyed by top-level
		 *  field, `issues` raw (use `zodIssuesForArrayItem` for per-row errors). */
		extraFields?: Snippet<[MutationFormExtraFieldsProps<T>]>;
		actions?: Snippet<[{ busy: boolean }]>;
		class?: string;
	} = $props();

	const id = $props.id();
	const progress = useProgress();

	// svelte-ignore state_referenced_locally
	const resetSnapshot: T = $state.snapshot(initialValues ?? values) as T;

	let fieldErrors = $state<MutationFormFieldErrors<T>>({});
	// Raw issues, handed to `extraFields` so array editors (rendered outside the declared
	// fields) can surface per-row errors — `fieldErrors` only keys by the top path segment.
	let issues = $state<readonly ZodIssue[]>([]);
	let busy = $state(false);

	const resolvedSections = $derived<MutationFormSection[]>(
		sections ?? (fields ? [{ fields, plain: true }] : [])
	);

	function getValue(key: string): unknown {
		return (values as Record<string, unknown>)[key];
	}

	function setValue(key: string, next: unknown) {
		(values as Record<string, unknown>)[key] = next;
		if (key in fieldErrors) {
			const copy = { ...fieldErrors };
			delete copy[key as keyof T & string];
			fieldErrors = copy;
		}
	}

	function spanClass(field: MutationFormFieldDef, columns: 1 | 2) {
		if (columns === 1) return '';
		return (field.colSpan ?? 2) === 1 ? 'sm:col-span-1' : 'sm:col-span-2';
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		const valueSnapshot = $state.snapshot(values) as T;
		const validation = schema.safeParse(valueSnapshot);
		if (!validation.success) {
			fieldErrors = zodIssuesToFieldErrors<keyof T & string>(validation.error.issues);
			issues = validation.error.issues;
			toast.error('Corrige los errores del formulario');
			return;
		}
		fieldErrors = {};
		issues = [];

		busy = true;
		progress.start();

		try {
			const args = { ...valueSnapshot } as Record<string, unknown>;

			const prepared = await prepareSubmit?.({
				values: valueSnapshot,
				sections: resolvedSections,
				args,
				progress
			});
			if (prepared === false) return;
			progress.markDone();

			const submitted = await onSubmit(args, valueSnapshot);
			if (submitted === false) return;
			onSuccess?.($state.snapshot(values) as T);
			if (resetOnSuccess) values = structuredClone(resetSnapshot);
		} finally {
			busy = false;
			progress.clear();
		}
	}

	const showUploadProgress = $derived(hasUploadFields(resolvedSections));
</script>

{#snippet renderField(field: MutationFormFieldDef)}
	{@const inputId = `${field.id}-${id}`}
	{@const err = fieldErrors[field.id as keyof T & string]}
	{@const custom = customFields?.[field.id]}

	{#if field.kind === 'checkbox' && !custom}
		<Field orientation="horizontal" class={field.fieldClass}>
			<CheckboxField
				{field}
				{inputId}
				value={getValue(field.id)}
				setValue={(v) => setValue(field.id, v)}
				invalid={!!err}
			/>
			<FieldLabel for={inputId}>{field.label}</FieldLabel>
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</Field>
	{:else if field.kind === 'switch' && !custom}
		<Field orientation="horizontal" class={field.fieldClass}>
			<SwitchField
				{field}
				{inputId}
				value={getValue(field.id)}
				setValue={(v) => setValue(field.id, v)}
				invalid={!!err}
			/>
			<FieldLabel for={inputId}>{field.label}</FieldLabel>
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</Field>
	{:else if field.kind === 'radio' && !custom}
		<FieldSet class={field.fieldClass}>
			<FieldLegend variant="label">{field.label}</FieldLegend>
			<RadioGroupField
				{field}
				{inputId}
				value={getValue(field.id)}
				setValue={(v) => setValue(field.id, v)}
				invalid={!!err}
			/>
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</FieldSet>
	{:else}
		<Field class={field.fieldClass}>
			<FieldLabel for={inputId}>{field.label}</FieldLabel>
			{#if custom}
				{@render custom({
					field,
					value: getValue(field.id) as T[keyof T],
					setValue: (next) => setValue(field.id, next),
					error: err,
					inputId
				})}
			{:else if field.kind === 'textarea'}
				<TextareaField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else if field.kind === 'upload-single' || field.kind === 'upload-multiple'}
				<UploadField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else if field.kind === 'select'}
				<SelectField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{:else}
				<InputField
					{field}
					{inputId}
					value={getValue(field.id)}
					setValue={(v) => setValue(field.id, v)}
					invalid={!!err}
				/>
			{/if}
			{#if err}
				<FieldError>{err}</FieldError>
			{:else if field.description}
				<FieldDescription>{field.description}</FieldDescription>
			{/if}
		</Field>
	{/if}
{/snippet}

{#snippet renderGrid(section: MutationFormSection)}
	{@const columns = section.columns ?? 2}
	<div class={cn('grid gap-4', columns === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
		{#each section.fields as field (field.id)}
			<div class={spanClass(field, columns)}>
				{@render renderField(field)}
			</div>
		{/each}
	</div>
{/snippet}

<!-- novalidate: the zod schema is the validator — native browser bubbles would fire
     before handleSubmit and block the schema's field errors from ever rendering. -->
<form onsubmit={handleSubmit} novalidate class={cn('flex flex-col gap-6', className)}>
	{@render header?.()}

	{#each resolvedSections as section, i (section.id ?? i)}
		{#if section.plain}
			<FieldGroup class={section.class}>
				{#if section.title}
					<FieldSet>
						<FieldLegend>{section.title}</FieldLegend>
						{#if section.description}
							<FieldDescription>{section.description}</FieldDescription>
						{/if}
					</FieldSet>
				{/if}
				{@render renderGrid(section)}
			</FieldGroup>
		{:else}
			<Card class={section.class}>
				{#if section.title || section.description}
					<CardHeader>
						{#if section.title}
							<CardTitle>{section.title}</CardTitle>
						{/if}
						{#if section.description}
							<CardDescription>{section.description}</CardDescription>
						{/if}
					</CardHeader>
				{/if}
				<CardContent>
					{@render renderGrid(section)}
				</CardContent>
			</Card>
		{/if}
	{/each}

	{@render extraFields?.({ errors: fieldErrors, issues })}

	{#if busy && showUploadProgress}
		<div class="flex w-full flex-col gap-2">
			<Progress value={progress.percent} class="h-2" />
			<p class="text-xs text-muted-foreground tabular-nums">{progress.label}</p>
		</div>
	{/if}

	{#if actions}
		{@render actions({ busy })}
	{:else}
		<Button type="submit" class="w-full" disabled={busy}>{submitLabel}</Button>
	{/if}
</form>
