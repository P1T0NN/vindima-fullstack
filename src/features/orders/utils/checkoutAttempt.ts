/**
 * The persistent checkout attempt id (`StripeSystemDesign.md` §5.3).
 *
 * `attemptId` is the key `placeOrder` dedupes on. Making it **per browser** rather than per page
 * mount is what turns placement into "one live draft order per browser": every resubmit — a
 * retry, a second tab, coming back after abandoning a payment, an edited cart — resolves to the
 * SAME pending order, which is updated in place instead of spawning a sibling. No duplicate
 * pending orders, and no superseded Stripe session left payable.
 *
 * Cleared when the intent completes (success page). A stale value is harmless: the server
 * rejects another user's draft with `ATTEMPT_CONFLICT`, and the caller regenerates once.
 *
 * Storage is best-effort — private mode and disabled-storage browsers throw on access, and
 * checkout must never break for that. The in-memory fallback keeps a single tab consistent,
 * which is the case that matters for retries.
 */
const STORAGE_KEY = 'checkout:attemptId';

let memoryFallback: string | null = null;

function readStored(): string | null {
	try {
		return localStorage.getItem(STORAGE_KEY);
	} catch {
		return null;
	}
}

function writeStored(value: string): void {
	try {
		localStorage.setItem(STORAGE_KEY, value);
	} catch {
		// Ignored on purpose — `memoryFallback` already holds it for this tab.
	}
}

/** Read the current attempt id, creating (and persisting) one on first use. */
export function readOrCreateAttemptId(): string {
	const stored = readStored();
	if (stored) return stored;
	if (memoryFallback) return memoryFallback;

	const fresh = crypto.randomUUID();
	memoryFallback = fresh;
	writeStored(fresh);
	return fresh;
}

/**
 * Forget the current attempt so the next placement starts a brand-new order. Called when the
 * checkout intent is complete (success page) and when the server reports the stored id belongs
 * to someone else's draft.
 */
export function clearAttemptId(): void {
	memoryFallback = null;
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		// Ignored — clearing the in-memory value is the part that must not fail.
	}
}
