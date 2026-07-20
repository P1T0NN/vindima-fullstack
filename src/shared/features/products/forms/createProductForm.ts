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
					required: true,
					placeholder: 'boards-1',
					description: 'Permanent ID for grouping and admin lookups.',
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
					label: 'Images',
					kind: 'upload-multiple',
					accept: 'image/*',
					description: 'Optional — the first image is the cover; a placeholder is shown without one.'
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
