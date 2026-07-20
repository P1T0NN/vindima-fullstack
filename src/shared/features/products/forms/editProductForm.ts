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
			title: 'Product details',
			description: 'What shoppers see on the card and in the cart.',
			fields: [
				{
					id: 'name',
					label: 'Name',
					kind: 'input',
					required: true,
					placeholder: 'e.g. Cheese board'
				},
				{
					id: 'description',
					label: 'Description',
					kind: 'textarea',
					rows: 2,
					placeholder: 'Short text shown on the product card…'
				},
				{
					id: 'slug',
					label: 'Slug',
					kind: 'input',
					disabled: true,
					description: 'Permanent ID — cannot be changed after creation.',
					colSpan: 1
				},
				{
					id: 'category',
					label: 'Category',
					kind: 'select',
					required: true,
					options: categoryOptions,
					selectPlaceholder: 'Choose a category',
					description: 'Shop pages group and filter by this.',
					colSpan: 1
				}
			]
		},
		{
			id: 'merchandising',
			title: 'Merchandising',
			description: 'Image, ordering, and highlighting in listings.',
			fields: [
				{
					id: 'images',
					label: 'Replace images',
					kind: 'upload-multiple',
					accept: 'image/*',
					description:
						'Optional — upload to replace the current images; leave empty to keep them. First image is the cover.'
				},
				// Toggles get their own full-width row — never inline with inputs.
				{
					id: 'featured',
					label: 'Featured',
					kind: 'switch',
					description: 'Shows the highlight badge.'
				}
			]
		}
	];
}
