// LIBRARIES
import { z } from 'zod';

/**
 * Human error copy for the SHARED zod schemas — installed on the client, and only on the client.
 *
 * ## The problem this solves
 * The schemas under `src/shared/features/<feature>/schemas/` are imported by BOTH browser and Convex
 * (`zodToConvexFields` derives the mutation's args from the same schema that validates the form).
 * That is the whole point: one definition, no drift. But it means anything those schemas import
 * gets bundled into the backend too — so putting translated strings in them would drag an i18n
 * runtime into Convex functions that will never render a word to anybody.
 *
 * ## The solution
 * Zod already separates *what is invalid* from *how you say so*. A schema records the rule; an
 * **error map** turns a violation into a sentence. So the schemas stay message-free and portable,
 * and the sentences live here, in `src/features/**` — a layer Convex never imports.
 *
 * Call `installZodMessages()` once at app boot (the root layout). After that every `safeParse` in
 * the browser produces Spanish copy, including parses inside `ConvexMutationForm`, with no schema
 * touched and nothing added to the server bundle.
 *
 * The backend keeps zod's built-in English defaults, which is correct: its messages are never
 * shown to a user. Convex returns message KEYS (`{ success, message: { key } }`) and the client
 * translates those — a schema-level parse failure there means a client bypassed validation, and
 * it collapses to `GenericMessages.UNEXPECTED_ERROR` by design.
 *
 * ## Adding translations later
 * This file is the single seam. Swap the string literals below for `m.some_key()` (paraglide,
 * wuchale, anything) and the whole app is translated — schemas, Convex, and every other feature
 * stay untouched, and the backend bundle still contains zero translation code.
 */

/** Field-specific copy, keyed by the schema path zod reports (`contact.email`, `lines`). */
const BY_PATH: Record<string, string> = {
	'contact.name': 'Escribe tu nombre.',
	'contact.email': 'Escribe un correo electrónico válido.',
	'contact.phone': 'Escribe un teléfono válido.',
	'delivery.address.line1': 'Escribe tu calle y número.',
	'delivery.address.city': 'Escribe tu ciudad.',
	'delivery.address.postcode': 'Escribe tu código postal.',
	'delivery.address.country': 'Escribe tu país.',
	lines: 'Tu carrito está vacío.'
};

/** Generic copy by violation, used when a path has no bespoke sentence. */
function genericMessage(issue: { code?: string; expected?: string; minimum?: unknown }): string {
	switch (issue.code) {
		case 'invalid_type':
			// Zod reports a missing required field as an `undefined` input, not a separate code.
			return issue.expected === 'string' || issue.expected === 'number'
				? 'Este campo es obligatorio.'
				: 'Revisa este campo.';
		case 'too_small':
			return issue.minimum === 1 || issue.minimum === 0
				? 'Este campo es obligatorio.'
				: `Debe tener al menos ${String(issue.minimum)} caracteres.`;
		case 'too_big':
			return 'El valor es demasiado largo.';
		case 'invalid_format':
			return 'El formato no es válido.';
		case 'invalid_value':
		case 'invalid_union':
			return 'Selecciona una opción válida.';
		default:
			return 'Revisa este campo.';
	}
}

/**
 * Install the global error map. Idempotent, so a hot reload or a second call is harmless.
 *
 * Returning `undefined` for an issue lets zod fall back to its own message — which is what we
 * want for schema-level `.refine()` calls that already carry deliberate, specific copy (the
 * checkout form's address rules do exactly that).
 */
export function installZodMessages(): void {
	z.config({
		customError: (issue) => {
			const path = issue.path?.join('.') ?? '';
			const bespoke = BY_PATH[path];
			if (bespoke) return bespoke;
			return genericMessage(issue as { code?: string; expected?: string; minimum?: unknown });
		}
	});
}
