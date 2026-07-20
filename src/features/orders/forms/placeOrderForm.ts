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
		label: 'Nombre',
		kind: 'input',
		required: true,
		autocomplete: 'name',
		placeholder: 'Juan Pérez',
		colSpan: 1
	},
	{
		id: 'email',
		label: 'Correo electrónico',
		kind: 'input',
		type: 'email',
		required: true,
		autocomplete: 'email',
		placeholder: 'correo@ejemplo.com',
		colSpan: 1
	},
	{
		id: 'phone',
		label: 'Teléfono',
		kind: 'input',
		type: 'tel',
		autocomplete: 'tel',
		placeholder: '449 000 0000',
		description: 'Opcional — solo lo usamos si necesitamos contactarte sobre este pedido.'
	}
];

const ADDRESS_FIELDS: MutationFormFieldDef[] = [
	{
		id: 'line1',
		label: 'Dirección',
		kind: 'input',
		autocomplete: 'address-line1',
		placeholder: 'Calle Principal 123'
	},
	{
		id: 'line2',
		label: 'Departamento, interior, etc.',
		kind: 'input',
		autocomplete: 'address-line2',
		placeholder: 'Departamento, interior, piso…',
		description: 'Opcional.'
	},
	{
		id: 'city',
		label: 'Ciudad',
		kind: 'input',
		autocomplete: 'address-level2',
		placeholder: 'Aguascalientes',
		colSpan: 1
	},
	{
		id: 'postcode',
		label: 'Código postal',
		kind: 'input',
		autocomplete: 'postal-code',
		placeholder: '20000',
		colSpan: 1
	},
	{
		id: 'country',
		label: 'País',
		kind: 'input',
		autocomplete: 'country-name',
		placeholder: 'México'
	}
];

const NOTE_FIELD: MutationFormFieldDef = {
	id: 'note',
	label: 'Nota del pedido',
	kind: 'textarea',
	rows: 2,
	placeholder: '¿Algo que debamos saber?',
	description: 'Opcional.'
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
			title: 'Tus datos',
			description: 'A dónde llegará la confirmación del pedido.',
			class: 'lg:col-start-1',
			fields: CONTACT_FIELDS
		},
		{
			id: 'delivery',
			title: 'Entrega',
			description: 'Cómo quieres recibir tu pedido.',
			class: 'lg:col-start-1',
			fields: [
				...(modeOptions.length > 1
					? [
							{
								id: 'mode',
								label: 'Método',
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
