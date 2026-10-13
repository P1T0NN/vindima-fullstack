import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';
import type { FieldConfig } from '@/components/ui/custom-components/form/formTypes.js';

export const couponFields: FieldConfig[] = [
	{
		kind: 'input',
		name: 'name',
		label: 'Nombre',
		placeholder: 'Promoción de temporada',
		required: true,
		maxLength: COUPONS_CONFIG.maxNameLength
	},
	{
		kind: 'input',
		name: 'code',
		label: 'Código',
		placeholder: 'BIENVENIDA10',
		description: 'Se guarda en mayúsculas, sin espacios al inicio ni al final.',
		required: true,
		maxLength: COUPONS_CONFIG.maxCodeLength
	},
	{
		kind: 'input',
		name: 'percentOff',
		label: 'Descuento (%)',
		description: 'Porcentaje del 1 al 99.',
		type: 'number',
		required: true,
		placeholder: '10'
	},
	{
		kind: 'input',
		name: 'minSubtotalMinor',
		label: 'Compra mínima',
		description: 'Importe en la moneda de la tienda. Déjalo vacío para no exigir un mínimo.',
		placeholder: '0.00'
	},
	{
		kind: 'input',
		name: 'maxRedemptions',
		label: 'Límite de usos',
		description: 'Déjalo vacío para usos ilimitados.',
		type: 'number',
		placeholder: '100'
	},
	{ kind: 'custom', name: 'expiresAt' },
	{ kind: 'custom', name: 'onePerCustomer' },
	{ kind: 'custom', name: 'active' }
];
