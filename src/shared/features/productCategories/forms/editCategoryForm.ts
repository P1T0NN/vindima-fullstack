/**
 * Declared section for the admin "edit category" form — the edit counterpart to
 * `createCategorySections`, rendered as one titled Card in `ConvexMutationForm`.
 *
 * Same three fields as create, since the same three things are owner-facing. The `slug` is
 * absent here too — it's immutable (products store it verbatim) and never shown. Only the
 * image copy differs: on edit the picker starts filled, so it explains replace-vs-keep.
 */

// TYPES
import type { MutationFormSection } from '@/components/ui/mutation-form/types';

export const editCategorySections: MutationFormSection[] = [
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
				description:
					'El título de la tarjeta, y como aparece al elegir la categoría de un producto.'
			},
			{
				id: 'subtitle',
				label: 'Subtítulo',
				kind: 'input',
				placeholder: 'p. ej. Para picar',
				description: 'Etiqueta corta en mayúsculas sobre el título de la página. Opcional.'
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
				description: 'Sube otra para reemplazarla. Si la dejas vacía, se mantiene la actual.'
			}
		]
	}
];
