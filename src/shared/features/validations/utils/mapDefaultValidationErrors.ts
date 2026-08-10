// Zod's default error strings ("Invalid input: expected string, received undefined"),
// rewritten as human, UX-grade messages — emitted as message CODES from
// `validationsData.ts`, never text. Dual-runtime: zod is isolate-safe, so Convex and
// Svelte share this map; only the frontend turns codes into words.
//
// Installed globally by `config/validationsConfig.ts`. Precedence is zod's: a per-field
// message on a schema always wins, so this only replaces the raw zod defaults.

// CONFIG
import {
	VALIDATION_MESSAGE_KEYS as KEY,
	VALIDATION_PATH_MESSAGE_KEYS
} from '../data/validationsData.js';

/** Bare key when there's nothing to interpolate; `parseTranslatableMessage` reads the rest. */
function code(key: string, params?: Record<string, string | number | boolean>): string {
	return params ? JSON.stringify({ key, params }) : key;
}

function asNumber(value: unknown): number {
	return typeof value === 'bigint' ? Number(value) : (value as number);
}

/**
 * Zod v4 `customError` map. Returns a code (or serialized `{ key, params }`) for the
 * issues users actually hit in forms; returns `undefined` for exotic issues so zod's own
 * default still applies rather than us mistranslating something rare.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDefaultValidationErrors(issue: any): string | undefined {
	// A path with bespoke copy beats every generic rule below — a checkout field says
	// "Escribe tu ciudad", not "This field is required".
	const bespoke = VALIDATION_PATH_MESSAGE_KEYS[issue.path?.join('.') ?? ''];
	if (bespoke) return code(bespoke);

	switch (issue.code) {
		case 'invalid_type': {
			// The classic "field left empty" — zod reports it as a type error on undefined.
			if (issue.input === undefined || issue.input === null) return code(KEY.required);
			if (issue.expected === 'number') return code(KEY.notANumber);
			if (issue.expected === 'date') return code(KEY.invalidDate);
			return code(KEY.invalidValue);
		}
		case 'too_small': {
			const min = asNumber(issue.minimum);
			if (issue.origin === 'string') {
				// `.min(1)` is "required" in intent, not "at least 1 character".
				return min <= 1 ? code(KEY.required) : code(KEY.textTooShort, { min });
			}
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return min === 0 && issue.inclusive
					? code(KEY.numberNotNegative)
					: code(KEY.numberTooSmall, { min });
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return code(KEY.tooFewItems, { min });
			}
			return undefined;
		}
		case 'too_big': {
			const max = asNumber(issue.maximum);
			if (issue.origin === 'string') return code(KEY.textTooLong, { max });
			if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
				return code(KEY.numberTooBig, { max });
			}
			if (issue.origin === 'array' || issue.origin === 'set') {
				return code(KEY.tooManyItems, { max });
			}
			return undefined;
		}
		case 'invalid_format': {
			if (issue.format === 'email') return code(KEY.invalidEmail);
			if (issue.format === 'url') return code(KEY.invalidUrl);
			return code(KEY.invalidValue);
		}
		// Wrong literal / enum member — selects, radio groups, discriminators.
		case 'invalid_value':
			return code(KEY.invalidChoice);
		default:
			return undefined;
	}
}
