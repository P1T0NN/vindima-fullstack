/**
 * Declared section for the admin "edit category" form — the edit counterpart to
 * `createCategorySections`, rendered as one titled Card in `Form`.
 *
 * The image picker is declared as an upload field so `Form` renders its native `UploadFile`
 * control; the edit form seeds the bound upload list with the existing image.
 */

// TYPES
import type { FormSection } from '@/components/ui/custom-components/form/formTypes';

export const editCategorySections: FormSection[] = [
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
				accept: 'image/*',
				description: 'Sube una imagen nueva para reemplazar la actual.'
			}
		]
	}
];
