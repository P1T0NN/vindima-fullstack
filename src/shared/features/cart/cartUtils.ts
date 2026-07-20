/**
 * Pure cart logic — no Svelte, no Convex ctx. Shared by the client `CartState`
 * and the server `mergeGuestCart` mutation so the merge rules live in exactly one
 * place. See `CartSystem.md` §4, §7.
 */

/** One cart line. Same shape on the client, in localStorage, and in the Convex doc. */
export type CartLine = {
	/** Opaque product reference (id/slug/SKU). Resolved to display data app-side. */
	productRef: string;
	/** Integer quantity, 1..MAX_QTY_PER_LINE. */
	qty: number;
	/** ms epoch when the line was first added. Stable sort key so lines never jump. */
	addedAt: number;
};

/** Clamp a (possibly hostile) quantity to a valid integer in `[min, max]`. */
export function clampQty(qty: number, max: number, min = 1): number {
	if (!Number.isFinite(qty)) return min;
	return Math.max(min, Math.min(max, Math.trunc(qty)));
}

/** Stable sort: oldest-added first. Returns a new array. */
export function sortLines(lines: CartLine[]): CartLine[] {
	return [...lines].sort((a, b) => a.addedAt - b.addedAt);
}

/**
 * Upsert a line: existing ref → `qty += add` (clamped); new ref → append.
 * Returns a new array. `onOverflow` fires (once) when a *new* ref would exceed
 * `maxLines` so the caller can reject/toast; the line is not added in that case.
 */
export function upsertLine(
	lines: CartLine[],
	productRef: string,
	add: number,
	now: number,
	maxQty: number,
	maxLines: number,
	onOverflow?: () => void
): CartLine[] {
	const existing = lines.find((l) => l.productRef === productRef);
	if (existing) {
		return lines.map((l) =>
			l.productRef === productRef ? { ...l, qty: clampQty(l.qty + add, maxQty) } : l
		);
	}
	if (lines.length >= maxLines) {
		onOverflow?.();
		return lines;
	}
	return [...lines, { productRef, qty: clampQty(add, maxQty), addedAt: now }];
}

/** Set a line's absolute quantity. `qty <= 0` removes it. Returns a new array. */
export function setLineQty(
	lines: CartLine[],
	productRef: string,
	qty: number,
	maxQty: number
): CartLine[] {
	if (qty <= 0) return lines.filter((l) => l.productRef !== productRef);
	return lines.map((l) => (l.productRef === productRef ? { ...l, qty: clampQty(qty, maxQty) } : l));
}

/**
 * Merge a guest cart into a server cart on login (§7). Union by `productRef`;
 * on collision keep `max(qty)` (never sum — same item on two devices means "want it",
 * not "want double") and the earlier `addedAt`. Clamp qty; truncate to `maxLines`
 * keeping server lines first, then guest lines by `addedAt`. Deterministic and
 * idempotent — running it twice is a no-op.
 */
export function mergeLines(
	serverLines: CartLine[],
	guestLines: CartLine[],
	maxQty: number,
	maxLines: number
): CartLine[] {
	const byRef = new Map<string, CartLine>();
	for (const l of serverLines) byRef.set(l.productRef, { ...l, qty: clampQty(l.qty, maxQty) });
	for (const g of guestLines) {
		const existing = byRef.get(g.productRef);
		if (existing) {
			byRef.set(g.productRef, {
				productRef: g.productRef,
				qty: clampQty(Math.max(existing.qty, g.qty), maxQty),
				addedAt: Math.min(existing.addedAt, g.addedAt)
			});
		} else {
			byRef.set(g.productRef, { ...g, qty: clampQty(g.qty, maxQty) });
		}
	}
	return sortLines([...byRef.values()]).slice(0, maxLines);
}

/**
 * Parse a stored guest cart. Anything malformed → `[]` (a lost guest cart is
 * acceptable; a crashed app is not). Silently drops lines with a bad shape.
 */
export function parseStoredCart(raw: string | null): CartLine[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		const lines = (parsed as { lines?: unknown })?.lines;
		if (!Array.isArray(lines)) return [];
		return lines.filter(isCartLine);
	} catch {
		return [];
	}
}

/** Serialize lines for localStorage. */
export function serializeCart(lines: CartLine[]): string {
	return JSON.stringify({ lines });
}

function isCartLine(x: unknown): x is CartLine {
	return (
		!!x &&
		typeof (x as CartLine).productRef === 'string' &&
		typeof (x as CartLine).qty === 'number' &&
		typeof (x as CartLine).addedAt === 'number'
	);
}
