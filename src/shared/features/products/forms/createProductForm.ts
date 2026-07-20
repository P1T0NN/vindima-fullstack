/**
 * Declared sections for the admin "create product" form — each renders as a titled Card in
 * `ConvexMutationForm`.
 *
 * A builder function (not a const) because the category select's options come from the
 * `fetchAllCategories` query at runtime (ProductCategorySystemDesign.md §6.1) — the owner
 * picks a category, never types one. Option `value` = slug (what the DB stores), option
 * `label` = display name (what the owner reads).
 *
 * Only scalar fields are declared here; the variants array editor can't be expressed as a
 * flat field and lives in the page's `extraFields` snippet (as its own matching Card).
 */

// TYPES
import type {
	MutationFormSection,
	MutationFormSelectOption
} from '@/components/ui/mutation-form/types';

export function createProductSections(
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
					id: 'slug',
					label: 'Slug',
					kind: 'input',
					required: true,
					placeholder: 'tablas-1',
					description: 'Identificador permanente para agrupación y búsquedas en admin.',
					colSpan: 1
				},
				{
					id: 'category',
					label: 'Categoría',
					kind: 'select',
					required: true,
					options: categoryOptions,
					selectPlaceholder: 'Elige una categoría',
					description: 'La tienda agrupa y filtra por esta categoría.',
					colSpan: 1
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
					label: 'Imágenes',
					kind: 'upload-multiple',
					accept: 'image/*',
					hasCoverImage: true,
					description: 'Se requiere al menos una imagen — la marcada con estrella es la portada.'
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
