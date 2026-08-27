/**
 * Declared sections for the admin "create product" form — each renders as a titled Card in
 * `Form`.
 *
 * A builder function (not a const) because the category select's options come from the
 * `fetchAllCategories` query at runtime (ProductCategorySystemDesign.md §6.1) — the owner
 * picks a category, never types one. Option `value` = slug (what the DB stores), option
 * `label` = display name (what the owner reads).
 *
 * Only scalar fields are declared here; the variants array editor can't be expressed as a
 * flat field and lives in the page's `extraFields` snippet (as its own matching Card).
 *
 * The product's `slug` is deliberately NOT a field: admins aren't developers and shouldn't
 * have to invent an identifier. `createProduct` derives it from the name.
 */

// TYPES
import type {
	FormSection,
	FormSelectOption
} from '@/components/ui/custom-components/form/formTypes';

export function createProductSections(categoryOptions: FormSelectOption[]): FormSection[] {
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
					required: true,
					mode: 'single',
					accept: 'image/*',
					description: 'La imagen que los clientes ven en la tienda. Obligatoria.'
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
