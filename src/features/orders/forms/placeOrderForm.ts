/** Declared sections for the pickup-only place-order form. */

// TYPES
import type {
	CustomField,
	FieldConfig,
	FormSection
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
		required: true,
		placeholder: '449 000 0000'
	}
];

const NOTE_FIELD: FieldConfig = {
	name: 'note',
	label: 'Nota del pedido',
	kind: 'textarea',
	placeholder: '¿Algo que debamos saber?',
	description: 'Opcional.'
};

const PICKUP_SCHEDULE_FIELD: CustomField = { kind: 'custom', name: 'pickupSchedule' };

export function createPlaceOrderForm(): FormSection[] {
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
			title: 'Recoger pedido',
			description: 'Recuerda que Vindima está abierto de martes a domingo.',
			class: 'lg:col-start-1',
			fields: [PICKUP_SCHEDULE_FIELD, NOTE_FIELD]
		}
	];
}
