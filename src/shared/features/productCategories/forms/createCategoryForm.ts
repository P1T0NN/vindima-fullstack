/**
 * Declared section for the admin "new category" form — renders as one titled Card in `Form`.
 *
 * A plain const (not a builder like the product forms): nothing here depends on runtime
 * data. Three text fields plus one image — everything else about a category is derived, never typed:
 * the `slug` comes from the name server-side, and the storefront's price range is computed
 * from the category's products, so it can never go stale in the owner's copy.
 */

// TYPES
import type { FormSection } from '@/components/ui/custom-components/form/formTypes';

export const createCategorySections: FormSection[] = [
	{
		kind: 'section',
		title: 'Categoría',
		description: 'Así se ve en la portada de la tienda.',
		fields: [
			{
				name: 'name',
				label: 'Nombre',
				kind: 'input',
				required: true,
				placeholder: 'p. ej. Tablas de queso',
				description:
					'El título de la tarjeta, y como aparece al elegir la categoría de un producto.'
			},
			{
				name: 'subtitle',
				label: 'Subtítulo',
				kind: 'input',
				placeholder: 'p. ej. Para picar',
				description: 'Etiqueta corta en mayúsculas sobre el título de la página. Opcional.'
			},
			{
				name: 'description',
				label: 'Descripción',
				kind: 'textarea',
				placeholder: 'p. ej. Charcutería y queso para compartir',
				description: 'Una línea corta bajo el título. Máximo 120 caracteres.'
			},
			{
				name: 'image',
				label: 'Imagen',
				kind: 'upload',
				required: true,
				accept: 'image/*',
				description: 'La imagen de la tarjeta. Obligatoria.'
			}
		]
	}
];
