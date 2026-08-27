/**
 * Declared sections for the admin "edit product" form — the edit counterpart to
 * `createProductSections`. Each renders as a titled Card in `Form`.
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
import type { FormSection } from '@/components/ui/custom-components/form/formTypes';

type FormSelectOption = { value: string; label: string };

export function editProductSections(categoryOptions: FormSelectOption[]): FormSection[] {
	return [
		{
			kind: 'section',
			title: 'Detalles del producto',
			description: 'Lo que ven los clientes en la ficha y en el carrito.',
			fields: [
				{
					name: 'name',
					label: 'Nombre',
					kind: 'input',
					required: true,
					placeholder: 'p. ej. Tabla de quesos'
				},
				{
					name: 'description',
					label: 'Descripción',
					kind: 'textarea',
					placeholder: 'Texto breve que aparece en la ficha del producto...'
				},
				{
					name: 'category',
					label: 'Categoría',
					kind: 'select',
					required: true,
					options: categoryOptions,
					placeholder: 'Elige una categoría',
					description: 'La tienda agrupa y filtra por esta categoría.'
				}
			]
		},
		{
			kind: 'section',
			title: 'Merchandising',
			description: 'Imagen, orden y destacado en los listados.',
			fields: [
				{
					name: 'images',
					label: 'Imagen',
					kind: 'upload',
					accept: 'image/*',
					description: 'Sube otra para reemplazarla. Si la dejas vacía, se mantiene la actual.'
				},
				// Toggles get their own full-width row — never inline with inputs.
				{
					name: 'featured',
					label: 'Destacado',
					kind: 'checkbox',
					description: 'Muestra la insignia de destacado.'
				}
			]
		}
	];
}
