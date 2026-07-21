/**
 * Declared section for the admin "new category" form — renders as one titled Card in
 * `ConvexMutationForm`.
 *
 * A plain const (not a builder like the product forms): nothing here depends on runtime
 * data. Three fields only — everything else about a category is derived, never typed:
 * the `slug` comes from the name server-side, and the storefront's price range is computed
 * from the category's products, so it can never go stale in the owner's copy.
 */

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

export const createCategorySections: MutationFormSection[] = [
	{
		id: 'category',
		title: 'Categoría',
		description: 'Así se ve en la portada de la tienda.',
		fields: [
			{
				id: 'name',
				label: 'Nombre',
				kind: 'input',
				required: true,
				placeholder: 'p. ej. Tablas de queso',
				description: 'El título de la tarjeta, y como aparece al elegir la categoría de un producto.'
			},
			{
				id: 'description',
				label: 'Descripción',
				kind: 'textarea',
				rows: 2,
				placeholder: 'p. ej. Charcutería y queso para compartir',
				description: 'Una línea corta bajo el título. Máximo 120 caracteres.'
			},
			{
				id: 'image',
				label: 'Imagen',
				kind: 'upload-single',
				accept: 'image/*',
				uploadPrefix: 'categories',
				allowUrl: true,
				description: 'La imagen de la tarjeta. Obligatoria.'
			}
		]
	}
];
