// TYPES
import type { Snippet } from 'svelte';

export type FormFieldValue = string | number | boolean;
export type FormValues = Record<string, FormFieldValue>;
export type FormSelectOption = { value: string; label: string; disabled?: boolean };

export type FormFieldContext<Value = FormFieldValue> = {
	values: Record<string, Value | undefined>;
	getValue: (name: string) => Value | undefined;
	setValue: (name: string, value: Value | undefined) => void;
	inputValue: (name: string) => string;
	checkboxValue: (name: string) => boolean;
	disabled: boolean;
};

export type BaseField = {
	name: string;
	label?: string;
	description?: string;
	placeholder?: string;
	required?: boolean;
	disabled?: boolean;
	/** Extra classes for the wrapping <Field>. */
	class?: string;
};

export type FormSection = {
	kind: 'section';
	/** Card title shown above the grouped fields. */
	title?: string;
	description?: string;
	fields: FieldConfig[];
	/** Extra classes for the wrapping <Card>. */
	class?: string;
};

export type InputField = BaseField & {
	kind: 'input';
	type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'search' | 'tel' | 'url';
	maxLength?: number;
};

export type TextareaField = BaseField & { kind: 'textarea' };

export type SelectField = BaseField & {
	kind: 'select';
	options: FormSelectOption[];
};

export type RadioField = BaseField & {
	kind: 'radio';
	options: FormSelectOption[];
	radioOrientation?: 'horizontal' | 'vertical';
};

export type CheckboxField = BaseField & { kind: 'checkbox' };

export type UploadMode = 'single' | 'multiple';

export type UploadField = BaseField & {
	kind: 'upload';
	/** Single file by default; use `multiple` to allow several images. */
	mode?: UploadMode;
	/** Accepted file types. */
	accept?: string;
};

export type CustomField = {
	kind: 'custom';
	name: string;
};

export type FormControlField =
	| InputField
	| TextareaField
	| SelectField
	| RadioField
	| CheckboxField;
export type FieldConfig = FormControlField | FormSection | UploadField | CustomField;

export type ExtraFields<Value = FormFieldValue> = Snippet<[FormFieldContext<Value>]>;
