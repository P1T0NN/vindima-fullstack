/**
 * Declared sections for the place-order form — each renders as a titled Card in `Form`.
 *
 * The shape depends on config and on what the shopper picked, so this is a function rather than a
 * constant: the mode picker only appears when there is a choice to make, and the address block only
 * when the picked mode needs one.
 */

// TYPES
import type {
	FieldConfig,
	FormSection,
	FormSelectOption
} from '@/components/ui/custom-components/form/formTypes';

const CONTACT_FIELDS: FieldConfig[] = [
	{
		name: 'name',
		label: 'Nombre',
		kind: 'input',
		required: true,
		placeholder: 'Juan Pérez'
	},
	{
		name: 'email',
		label: 'Correo electrónico',
		kind: 'input',
		type: 'email',
		required: true,
		placeholder: 'correo@ejemplo.com'
	},
	{
		name: 'phone',
		label: 'Teléfono',
		kind: 'input',
		type: 'tel',
		placeholder: '449 000 0000',
		description: 'Opcional - Usaremos este número para contactarte sobre tu pedido'
	}
];

const ADDRESS_FIELDS: FieldConfig[] = [
	{
		name: 'line1',
		label: 'Dirección',
		kind: 'input',
		required: true,
		placeholder: 'Calle Principal 123'
	},
	{
		name: 'line2',
		label: 'Departamento, interior, etc.',
		kind: 'input',
		placeholder: 'Departamento, interior, piso...',
		description: 'Opcional.'
	},
	{
		name: 'city',
		label: 'Ciudad',
		kind: 'input',
		required: true,
		placeholder: 'Aguascalientes'
	},
	{
		name: 'postcode',
		label: 'Código postal',
		kind: 'input',
		required: true,
		placeholder: '20000'
	},
	{
		name: 'country',
		label: 'País',
		kind: 'input',
		required: true,
		placeholder: 'México'
	}
];

const NOTE_FIELD: FieldConfig = {
	name: 'note',
	label: 'Nota del pedido',
	kind: 'textarea',
	placeholder: '¿Algo que debamos saber?',
	description: 'Opcional.'
};

export function createPlaceOrderForm(params: {
	/** Fulfillment modes enabled in config. A single option renders no picker. */
	modeOptions: FormSelectOption[];
	/** Payment methods offered (disabled ones still render as "coming soon" cards). */
	paymentOptions: FormSelectOption[];
	/** Whether the picked mode collects a shipping address. */
	showAddress: boolean;
}): FormSection[] {
	const { modeOptions, paymentOptions, showAddress } = params;

	return [
		{
			kind: 'section',
			title: 'Tus datos',
			description: 'A dónde llegará la confirmación del pedido.',
			class: 'lg:col-start-1',
			fields: CONTACT_FIELDS
		},
		{
			kind: 'section',
			title: 'Entrega',
			description: 'Cómo quieres recibir tu pedido.',
			class: 'lg:col-start-1',
			fields: [
				...(modeOptions.length > 1
					? [
							{
								name: 'mode',
								label: 'Método',
								kind: 'radio',
								options: modeOptions,
								radioOrientation: 'horizontal',
								required: true
							} satisfies FieldConfig
						]
					: []),
				...(showAddress ? ADDRESS_FIELDS : []),
				NOTE_FIELD
			]
		},
		{
			kind: 'section',
			title: 'Pago',
			description: 'Cómo quieres pagar tu pedido.',
			class: 'lg:col-start-1',
			fields: [
				{
					name: 'payment',
					label: 'Método de pago',
					kind: 'radio',
					options: paymentOptions,
					required: true
				}
			]
		}
	];
}
