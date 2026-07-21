/**
 * Declared fields for the admin "add reward item" form — rendered by `ConvexMutationForm`.
 * Options come from `fetchRewardCatalog` at runtime; the variant select only appears when
 * the picked product has more than one addable variant.
 */

// TYPES
import type {
	MutationFormFieldDef,
	MutationFormSelectOption
} from '@/components/ui/mutation-form/types';

export function createAddRewardItemFields(opts: {
	productOptions: MutationFormSelectOption[];
	variantOptions: MutationFormSelectOption[];
	showVariant: boolean;
	disabled?: boolean;
}): MutationFormFieldDef[] {
	const fields: MutationFormFieldDef[] = [
		{
			id: 'productId',
			label: 'Producto',
			kind: 'select',
			required: true,
			options: opts.productOptions,
			selectPlaceholder: 'Elige un producto',
			disabled: opts.disabled || opts.productOptions.length === 0,
			fieldClass: 'max-w-xs'
		}
	];

	if (opts.showVariant) {
		fields.push({
			id: 'variantId',
			label: 'Variante',
			kind: 'select',
			required: true,
			options: opts.variantOptions,
			selectPlaceholder: 'Elige una variante',
			disabled: opts.disabled,
			fieldClass: 'max-w-45'
		});
	}

	return fields;
}
