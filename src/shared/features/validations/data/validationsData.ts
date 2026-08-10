// The `ValidationMessages.*` catalog keys the default zod error map emits. Texts live in
// `../data/backendMessages.ts` under the same keys — add a key here, add its copy there,
// and `mapDefaultValidationErrors.ts` can start emitting it.

/** Generic, violation-shaped copy — the fallback when a path has no bespoke sentence. */
export const VALIDATION_MESSAGE_KEYS = {
	required: 'ValidationMessages.Default.required',
	invalidValue: 'ValidationMessages.Default.invalidValue',
	notANumber: 'ValidationMessages.Default.notANumber',
	invalidDate: 'ValidationMessages.Default.invalidDate',
	invalidEmail: 'ValidationMessages.Default.invalidEmail',
	invalidUrl: 'ValidationMessages.Default.invalidUrl',
	invalidChoice: 'ValidationMessages.Default.invalidChoice',
	textTooShort: 'ValidationMessages.Default.textTooShort',
	textTooLong: 'ValidationMessages.Default.textTooLong',
	tooFewItems: 'ValidationMessages.Default.tooFewItems',
	tooManyItems: 'ValidationMessages.Default.tooManyItems',
	numberNotNegative: 'ValidationMessages.Default.numberNotNegative',
	numberTooSmall: 'ValidationMessages.Default.numberTooSmall',
	numberTooBig: 'ValidationMessages.Default.numberTooBig'
} as const;

/**
 * Bespoke copy keyed by the schema path zod reports (`contact.email`, `lines`) — beats the
 * generic map above when a field deserves a sentence of its own. Project-specific by
 * nature: these paths come from this app's checkout schemas.
 */
export const VALIDATION_PATH_MESSAGE_KEYS: Record<string, string> = {
	'contact.name': 'ValidationMessages.Path.contactName',
	'contact.email': 'ValidationMessages.Path.contactEmail',
	'contact.phone': 'ValidationMessages.Path.contactPhone',
	'delivery.address.line1': 'ValidationMessages.Path.addressLine1',
	'delivery.address.city': 'ValidationMessages.Path.addressCity',
	'delivery.address.postcode': 'ValidationMessages.Path.addressPostcode',
	'delivery.address.country': 'ValidationMessages.Path.addressCountry',
	lines: 'ValidationMessages.Path.cartEmpty'
};
