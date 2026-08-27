// Zod's default error strings ("Invalid input: expected string, received undefined"),
// rewritten as human, UX-grade messages. Dual-runtime: zod is isolate-safe, so Convex and
// Svelte share this map.
//
// Installed globally by `config/validationsConfig.ts`. Precedence is zod's: a per-field
// message on a schema always wins, so this only replaces the raw zod defaults.

function asNumber(value: unknown): number {
	return typeof value === 'bigint' ? Number(value) : (value as number);
}

const PATH_MESSAGES: Record<string, string> = {
	'contact.name': 'Escribe tu nombre.',
	'contact.email': 'Escribe un correo electrónico válido.',
	'contact.phone': 'Escribe un teléfono válido.',
	'delivery.address.line1': 'Escribe tu calle y número.',
	'delivery.address.city': 'Escribe tu ciudad.',
	'delivery.address.postcode': 'Escribe tu código postal.',
	'delivery.address.country': 'Escribe tu país.',
	lines: 'Tu carrito está vacío.'
};

/**
 * Zod v4 `customError` map. Returns text for the issues users actually hit in forms;
 * returns `undefined` for exotic issues so zod's own default still applies.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDefaultValidationErrors(issue: any): string | undefined {
	// A path with bespoke copy beats every generic rule below — a checkout field says
	// "Escribe tu ciudad", not "This field is required".
	const bespoke = PATH_MESSAGES[issue.path?.join('.') ?? ''];
	if (bespoke) return bespoke;

	switch (issue.code) {
		case 'invalid_type': {
			// The classic "field left empty" — zod reports it as a type error on undefined.
			if (issue.input === undefined || issue.input === null) return 'Este campo es obligatorio.';
			if (issue.expected === 'number') return 'Escribe un número.';
			if (issue.expected === 'date') return 'Escribe una fecha válida.';
			return 'Revisa este campo.';
		}
		case 'too_small': {
			const min = asNumber(issue.minimum);
			if (issue.origin === 'string') {
				// `.min(1)` is "required" in intent, not "at least 1 character".
				return min <= 1 ? 'Este campo es obligatorio.' : `Debe tener al menos ${min} caracteres.`;
			}
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return min === 0 && issue.inclusive
					? 'No puede ser un número negativo.'
					: `Escribe ${min} o más.`;
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return `Agrega al menos ${min}.`;
			}
			return undefined;
		}
		case 'too_big': {
			const max = asNumber(issue.maximum);
			if (issue.origin === 'string') {
				return `El valor es demasiado largo (máx. ${max} caracteres).`;
			}
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return `Escribe ${max} o menos.`;
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return `Agrega como máximo ${max}.`;
			}
			return undefined;
		}
		case 'invalid_format': {
			if (issue.format === 'email') return 'Escribe un correo electrónico válido.';
			if (issue.format === 'url') return 'Escribe un enlace válido.';
			return 'Revisa este campo.';
		}
		// Wrong literal / enum member — selects, radio groups, discriminators.
		case 'invalid_value':
			return 'Selecciona una opción válida.';
		default:
			return undefined;
	}
}
