/**
 * Declared sections for the admin "edit product" form — the edit counterpart to
 * `createProductSections`. Each renders as a titled Card in `ConvexMutationForm`.
 *
 * A builder function (not a const) because the category select's options come from the
 * `fetchAllCategories` query at runtime (ProductCategorySystemDesign.md §6.1) — the owner
 * picks a category, never types one. The product's current slug preselects automatically
 * because `values.category` already holds it.
 *
 * Differences from create: `slug` is disabled (immutable after creation), and the images
 * field replaces rather than appends — leaving it empty keeps the product's current images.
 * The variants array editor can't be a flat field, so it lives in the page's `extraFields`.
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
					id: 'slug',
					label: 'Slug',
					kind: 'input',
					disabled: true,
					description: 'Identificador permanente — no se puede cambiar tras la creación.',
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
					description:
						'Marca una como portada; añade o quita libremente (no hace falta volver a subir). Se requiere al menos una imagen.'
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
