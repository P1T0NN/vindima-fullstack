import type { Snippet } from 'svelte';
import type { ZodIssue } from 'zod';
import type { FullAutoFill, HTMLInputTypeAttribute } from 'svelte/elements';

export type MutationFormFieldKind =
	| 'input'
	| 'textarea'
	| 'select'
	| 'checkbox'
	| 'switch'
	| 'radio'
	| 'upload-single'
	| 'upload-multiple';

export type MutationFormSelectOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

export type MutationFormFieldDef = {
	/** Key used in the values record, name attribute, and id suffix. */
	id: string;
	label: string;
	kind: MutationFormFieldKind;

	/** Common */
	placeholder?: string;
	description?: string;
	autocomplete?: FullAutoFill;
	autofocus?: boolean;
	disabled?: boolean;
	required?: boolean;
	fieldClass?: string;

	/** kind: 'input' */
	type?: HTMLInputTypeAttribute;

	/** kind: 'textarea' */
	rows?: number;

	/** kind: 'select' | 'radio' */
	options?: MutationFormSelectOption[];
	/** Trigger label when the bound value is empty. */
	selectPlaceholder?: string;

	/** kind: 'radio' */
	radioOrientation?: 'vertical' | 'horizontal';

	/** kind: 'upload-single' | 'upload-multiple' */
	accept?: string;

	/** kind: 'upload-multiple' — show the star control; the starred image becomes `files[0]` (the cover). */
	hasCoverImage?: boolean;

	/** Grid columns the field occupies inside a section. Defaults to 2 (full width). */
	colSpan?: 1 | 2;
};

export type MutationFormSection = {
	id?: string;
	title?: string;
	description?: string;
	fields: MutationFormFieldDef[];
	/** Section grid column count. Defaults to 2. */
	columns?: 1 | 2;
	/** Render the section without a Card wrapper. */
	plain?: boolean;
	class?: string;
};

export type MutationFormFieldSnippetProps<T extends Record<string, unknown>> = {
	field: MutationFormFieldDef;
	value: T[keyof T];
	setValue: (next: unknown) => void;
	error: string | undefined;
	inputId: string;
};

export type MutationFormCustomFields<T extends Record<string, unknown>> = Partial<
	Record<string, Snippet<[MutationFormFieldSnippetProps<T>]>>
>;

export type MutationFormFieldErrors<T extends Record<string, unknown>> = Partial<
	Record<keyof T & string, string | undefined>
>;

/**
 * Props handed to the `extraFields` snippet so blocks rendered outside the declared fields
 * (array editors, custom sections) can show validation state: `errors` keyed by top-level
 * field, `issues` raw — pass those to `zodIssuesForArrayItem` for per-row errors.
 */
export type MutationFormExtraFieldsProps<T extends Record<string, unknown>> = {
	errors: MutationFormFieldErrors<T>;
	issues: readonly ZodIssue[];
};

export type MutationFormProgress = {
	readonly percent: number;
	readonly label: string;
	start: (message?: string) => void;
	clear: () => void;
	setOptimizeProgress: (info: {
		overallOptimizePercent: number;
		fileIndex: number;
		totalFiles: number;
		fileCompressionPercent: number;
	}) => void;
	beforeUploadFile: (fileNum: number, totalFiles: number) => void;
	afterUploadFile: (fileNum: number, totalFiles: number) => void;
	markDone: (doneLabel?: string) => void;
};

export type MutationFormPrepareSubmit<T extends Record<string, unknown>> = (context: {
	values: T;
	args: Record<string, unknown>;
	sections: MutationFormSection[];
	progress: MutationFormProgress;
}) => boolean | void | Promise<boolean | void>;

export type MutationFormSubmitHandler<T extends Record<string, unknown>> = (
	args: Record<string, unknown>,
	values: T
) => boolean | void | Promise<boolean | void>;
