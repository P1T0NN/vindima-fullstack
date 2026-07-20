/**
 * Keys that must never reach the audit log. Matched case-insensitively against
 * any object key at any depth in `metadata` / `before` / `after`. Add project
 * specific keys here as they appear.
 */
const REDACT_KEYS = new Set(
	[
		'password',
		'passwordHash',
		'passwordHashed',
		'token',
		'accessToken',
		'refreshToken',
		'sessionToken',
		'apiKey',
		'secret',
		'signature',
		'authorization',
		'cookie'
	].map((k) => k.toLowerCase())
);

/**
 * Query-string params stripped from any URL-shaped string value. Covers the
 * AWS SigV4 / S3 / R2 presigned-URL family — `url` fields legitimately belong
 * in audit logs, but the embedded credential portion does not.
 */
const REDACT_URL_PARAMS = new Set(
	[
		'x-amz-signature',
		'x-amz-credential',
		'x-amz-security-token',
		'signature',
		'sig',
		'token',
		'access_token',
		'id_token'
	].map((k) => k.toLowerCase())
);

const REDACTED = '[REDACTED]';

/**
 * Scrub sensitive query-string params from a URL-shaped string. Returns the
 * original value untouched if it doesn't parse as a URL or has no query string —
 * we don't want this helper guessing or breaking innocuous strings.
 */
function redactUrl(value: string): string {
	if (!value.includes('?') || !/^https?:\/\//i.test(value)) return value;
	try {
		const u = new URL(value);
		let touched = false;
		for (const key of [...u.searchParams.keys()]) {
			if (REDACT_URL_PARAMS.has(key.toLowerCase())) {
				u.searchParams.set(key, REDACTED);
				touched = true;
			}
		}
		return touched ? u.toString() : value;
	} catch {
		return value;
	}
}

/**
 * Recursively replace values of sensitive keys with `[REDACTED]`. Cheap and
 * pure — safe to call on the audit-write hot path. Cycles are handled via a
 * `WeakSet`; non-plain objects (Dates, etc.) pass through unchanged.
 */
export function redact<T>(value: T, seen: WeakSet<object> = new WeakSet()): T {
	if (typeof value === 'string') return redactUrl(value) as unknown as T;
	if (value === null || typeof value !== 'object') return value;
	if (seen.has(value as object)) return value;
	seen.add(value as object);

	if (Array.isArray(value)) {
		return value.map((v) => redact(v, seen)) as unknown as T;
	}

	// Only recurse into plain objects to avoid mangling Dates, Maps, etc.
	const proto = Object.getPrototypeOf(value);
	if (proto !== Object.prototype && proto !== null) return value;

	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
		out[k] = REDACT_KEYS.has(k.toLowerCase()) ? REDACTED : redact(v, seen);
	}
	return out as T;
}

/**
 * Compute a compact `{ before, after }` of only the fields that actually changed.
 * Use this when you want a row-level audit without bloating the log with
 * unchanged columns.
 *
 * @example
 * const { before, after } = diff(prevDoc, nextDoc, ['role', 'email']);
 */
export function diff<T extends Record<string, unknown>>(
	prev: T | null | undefined,
	next: T | null | undefined,
	fields: (keyof T)[]
): { before: Partial<T>; after: Partial<T> } {
	const before: Partial<T> = {};
	const after: Partial<T> = {};
	for (const f of fields) {
		const a = prev?.[f];
		const b = next?.[f];
		if (a !== b) {
			before[f] = a as T[typeof f];
			after[f] = b as T[typeof f];
		}
	}
	return { before, after };
}
