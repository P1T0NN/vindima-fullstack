/**
 * Declared sections for the place-order form — each renders as a titled Card in `ConvexMutationForm`.
 *
 * The shape depends on config and on what the shopper picked, so this is a function rather than a
 * constant: the mode picker only appears when there is a choice to make, and the address block only
 * when the picked mode needs one.
 */

// TYPES
import type {
	MutationFormFieldDef,
	MutationFormSection,
	MutationFormSelectOption
} from '@/components/ui/mutation-form/types';

const CONTACT_FIELDS: MutationFormFieldDef[] = [
	{
		id: 'name',
		label: 'Name',
		kind: 'input',
		required: true,
		autocomplete: 'name',
		placeholder: 'Jane Doe',
		colSpan: 1
	},
	{
		id: 'email',
		label: 'Email',
		kind: 'input',
		type: 'email',
		required: true,
		autocomplete: 'email',
		placeholder: 'you@example.com',
		colSpan: 1
	},
	{
		id: 'phone',
		label: 'Phone',
		kind: 'input',
		type: 'tel',
		autocomplete: 'tel',
		placeholder: '449 000 0000',
		description: 'Optional — only used if we need to reach you about this order.'
	}
];

const ADDRESS_FIELDS: MutationFormFieldDef[] = [
	{
		id: 'line1',
		label: 'Address',
		kind: 'input',
		autocomplete: 'address-line1',
		placeholder: '123 Main Street'
	},
	{
		id: 'line2',
		label: 'Apartment, suite, etc.',
		kind: 'input',
		autocomplete: 'address-line2',
		placeholder: 'Apartment, suite, floor…',
		description: 'Optional.'
	},
	{
		id: 'city',
		label: 'City',
		kind: 'input',
		autocomplete: 'address-level2',
		placeholder: 'Aguascalientes',
		colSpan: 1
	},
	{
		id: 'postcode',
		label: 'Postcode',
		kind: 'input',
		autocomplete: 'postal-code',
		placeholder: '20000',
		colSpan: 1
	},
	{
		id: 'country',
		label: 'Country',
		kind: 'input',
		autocomplete: 'country-name',
		placeholder: 'Mexico'
	}
];

const NOTE_FIELD: MutationFormFieldDef = {
	id: 'note',
	label: 'Order note',
	kind: 'textarea',
	rows: 2,
	placeholder: 'Anything we should know?',
	description: 'Optional.'
};

export function createPlaceOrderForm(params: {
	/** Fulfillment modes enabled in config. A single option renders no picker. */
	modeOptions: MutationFormSelectOption[];
	/** Whether the picked mode collects a shipping address. */
	showAddress: boolean;
}): MutationFormSection[] {
	const { modeOptions, showAddress } = params;

	return [
		{
			id: 'contact',
			title: 'Your details',
			description: 'Where the order confirmation goes.',
			class: 'lg:col-start-1',
			fields: CONTACT_FIELDS
		},
		{
			id: 'delivery',
			title: 'Delivery',
			description: 'How you want to receive the order.',
			class: 'lg:col-start-1',
			fields: [
				...(modeOptions.length > 1
					? [
							{
								id: 'mode',
								label: 'Method',
								kind: 'radio',
								options: modeOptions,
								radioOrientation: 'horizontal',
								required: true
							} satisfies MutationFormFieldDef
						]
					: []),
				...(showAddress ? ADDRESS_FIELDS : []),
				NOTE_FIELD
			]
		}
	];
}
