/**
 * Declared sections for the admin "edit product" form — the edit counterpart to
 * `createProductSections`. Each renders as a titled Card in `ConvexMutationForm`.
 *
 * A builder function (not a const) because the category select's options come from the
 * `fetchAllCategories` query at runtime (ProductCategorySystemDesign.md §6.1) — the owner
 * picks a category, never types one. The product's current slug preselects automatically
 * because `values.category` already holds it.
 *
 * Differences from create: the images field replaces rather than appends — leaving it empty
 * keeps the product's current images. The variants array editor can't be a flat field, so it
 * lives in the page's `extraFields`.
 *
 * The product's `slug` is deliberately NOT a field: it's an internal identifier, immutable
 * after creation, and admins shouldn't have to think about it.
 */

// TYPES
import type {
	MutationFormSection,
	MutationFormSelectOption
} from '@/components/ui/mutation-form/types';

export function editProductSections(
	categoryOptions: MutationFormSelectOption[]
): MutationFormSection[] {
	return [
		{
			id: 'details',
			title: 'Detalles del producto',
			description: 'Lo que ven los clientes en la ficha y en el carrito.',
			fields: [
				{
					id: 'name',
					label: 'Nombre',
					kind: 'input',
					required: true,
					placeholder: 'p. ej. Tabla de quesos'
				},
				{
					id: 'description',
					label: 'Descripción',
					kind: 'textarea',
					rows: 2,
					placeholder: 'Texto breve que aparece en la ficha del producto…'
				},
				{
					id: 'category',
					label: 'Categoría',
					kind: 'select',
					required: true,
					options: categoryOptions,
					selectPlaceholder: 'Elige una categoría',
					description: 'La tienda agrupa y filtra por esta categoría.'
				}
			]
		},
		{
			id: 'merchandising',
			title: 'Merchandising',
			description: 'Imagen, orden y destacado en los listados.',
			fields: [
				{
					id: 'images',
					label: 'Imagen',
					kind: 'upload-single',
					accept: 'image/*',
					uploadPrefix: 'products',
					allowUrl: true,
					description: 'Sube otra para reemplazarla. Si la dejas vacía, se mantiene la actual.'
				},
				// Toggles get their own full-width row — never inline with inputs.
				{
					id: 'featured',
					label: 'Destacado',
					kind: 'switch',
					description: 'Muestra la insignia de destacado.'
				}
			]
		}
	];
}
