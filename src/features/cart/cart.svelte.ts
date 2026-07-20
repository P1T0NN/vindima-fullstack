// Single source of truth for the cart across the whole app. Guests persist to
// localStorage (zero network); authenticated users mirror a Convex `carts` doc with
// optimistic local writes reconciled by the live query. Consumers (header, sidebar,
// add-to-cart buttons) never branch on auth — they just call these methods.
// See CartSystem.md. Mirrors the module-singleton pattern of `authClass` / `header`.

// SVELTEKIT IMPORTS
import { browser } from '$app/environment';

// LIBRARIES
import { api } from '@/convex/_generated/api';

// CONFIG
import { CART_CONFIG } from '@/shared/config';

// COMPONENTS
import { toast } from 'svelte-sonner';

// UTILS
import { safeMutation } from '@/utils/convexHelpers';
import {
	parseStoredCart,
	serializeCart,
	setLineQty as setLineQtyPure,
	upsertLine,
	type CartLine
} from '@/shared/features/cart/cartUtils';

// TYPES
import type { ConvexClient } from 'convex/browser';

class CartState {
	/** The rendered cart. Optimistic in auth mode; server truth reconciles on settle. */
	lines = $state<CartLine[]>([]);
	isOpen = $state(false);
	/** True only while an authenticated user's cart is first loading (drives the skeleton). */
	loading = $state(false);

	/** Total quantity across lines — drives the header badge. */
	count = $derived(this.lines.reduce((n, l) => n + l.qty, 0));

	#authenticated = false;
	#convex: ConvexClient | null = null;
	/** In-flight server writes (incl. debounce windows). While > 0, local is authoritative. */
	#pendingWrites = 0;
	/** Latest server lines received while local was authoritative; applied on settle. */
	#latestServer: CartLine[] | undefined = undefined;
	/** Refs with a scheduled/in-flight stepper write, so reschedules don't double-count. */
	#dirtyRefs = new Set<string>();
	#timers = new Map<string, ReturnType<typeof setTimeout>>();

	constructor() {
		if (!browser) return;
		this.lines = parseStoredCart(localStorage.getItem(CART_CONFIG.STORAGE_KEY));
		// Adopt guest-cart changes from other tabs (auth mode syncs via Convex instead).
		window.addEventListener('storage', (e) => {
			if (e.key === CART_CONFIG.STORAGE_KEY && !this.#authenticated) {
				this.lines = parseStoredCart(e.newValue);
			}
		});
	}

	open() {
		this.isOpen = true;
	}
	close() {
		this.isOpen = false;
	}
	toggle() {
		this.isOpen = !this.isOpen;
	}

	/** Add `qty` of a product (upsert). Instant UI; server write in auth mode. */
	add(productRef: string, qty = 1) {
		let overflow = false;
		this.lines = upsertLine(
			this.lines,
			productRef,
			qty,
			Date.now(),
			CART_CONFIG.MAX_QTY_PER_LINE,
			CART_CONFIG.MAX_LINES,
			() => (overflow = true)
		);
		if (this.#authenticated) {
			this.#write(() =>
				safeMutation(this.#convex!, api.tables.cart.mutations.addLine.addLine, { productRef, qty })
			);
		} else {
			this.#persistGuest();
			if (overflow) toast.error('Your cart is full. Remove an item before adding another.');
		}
	}

	/** Set a line's absolute quantity. `0` removes it. Stepper writes are debounced. */
	setQty(productRef: string, qty: number) {
		this.lines = setLineQtyPure(this.lines, productRef, qty, CART_CONFIG.MAX_QTY_PER_LINE);
		if (this.#authenticated) this.#debouncedSet(productRef, qty);
		else this.#persistGuest();
	}

	/** Remove a line outright (= set qty 0). */
	remove(productRef: string) {
		this.lines = this.lines.filter((l) => l.productRef !== productRef);
		if (this.#authenticated) {
			this.#write(() =>
				safeMutation(this.#convex!, api.tables.cart.mutations.setLineQty.setLineQty, {
					productRef,
					qty: 0
				})
			);
		} else {
			this.#persistGuest();
		}
	}

	/** Empty the cart (e.g. after checkout success). */
	clear() {
		this.lines = [];
		if (this.#authenticated) {
			this.#write(() =>
				safeMutation(this.#convex!, api.tables.cart.mutations.clearCart.clearCart, {})
			);
		} else {
			this.#persistGuest();
		}
	}

	/**
	 * Called from the root layout with the current auth state + Convex client.
	 * Handles the guest→server merge on login and the reset-to-empty on logout.
	 */
	setAuth(authenticated: boolean, convex: ConvexClient) {
		this.#convex = convex;
		if (authenticated === this.#authenticated) return;
		this.#authenticated = authenticated;

		if (authenticated) {
			// Merge whatever guest lines are on this device into the server cart.
			// Idempotent, so a re-fire on the next page load safely retries a failed merge.
			const guestLines = this.lines;
			if (guestLines.length > 0) {
				this.#write(async () => {
					const res = await safeMutation(
						this.#convex!,
						api.tables.cart.mutations.mergeGuestCart.mergeGuestCart,
						{ lines: guestLines }
					);
					if (res) this.#clearGuestStorage(); // success → drop the guest copy
				});
			}
			// The getMyCart subscription now drives `lines` via syncFromServer().
		} else {
			// Logout: fall back to an empty guest cart. Never copy server data onto this
			// (possibly shared) device.
			this.#latestServer = undefined;
			this.lines = [];
			this.#clearGuestStorage();
		}
	}

	/** Called from the layout's getMyCart effect. `null`/`undefined` = signed out / loading. */
	syncFromServer(serverLines: CartLine[] | null | undefined) {
		if (serverLines == null) return;
		this.#latestServer = serverLines;
		if (this.#pendingWrites === 0) this.lines = serverLines;
	}

	#debouncedSet(ref: string, qty: number) {
		if (!this.#dirtyRefs.has(ref)) {
			this.#dirtyRefs.add(ref);
			this.#pendingWrites++;
		}
		const prev = this.#timers.get(ref);
		if (prev) clearTimeout(prev);
		this.#timers.set(
			ref,
			setTimeout(async () => {
				this.#timers.delete(ref);
				try {
					await safeMutation(this.#convex!, api.tables.cart.mutations.setLineQty.setLineQty, {
						productRef: ref,
						qty
					});
				} finally {
					this.#dirtyRefs.delete(ref);
					this.#release();
				}
			}, CART_CONFIG.STEPPER_DEBOUNCE_MS)
		);
	}

	async #write(fn: () => Promise<unknown>) {
		this.#pendingWrites++;
		try {
			await fn();
		} finally {
			this.#release();
		}
	}

	#release() {
		this.#pendingWrites = Math.max(0, this.#pendingWrites - 1);
		if (this.#pendingWrites === 0 && this.#authenticated && this.#latestServer !== undefined) {
			this.lines = this.#latestServer;
		}
	}

	#persistGuest() {
		if (!browser) return;
		try {
			localStorage.setItem(CART_CONFIG.STORAGE_KEY, serializeCart(this.lines));
		} catch {
			// localStorage unavailable (private mode / quota) — degrade to in-memory only.
		}
	}

	#clearGuestStorage() {
		if (!browser) return;
		try {
			localStorage.removeItem(CART_CONFIG.STORAGE_KEY);
		} catch {
			// ignore
		}
	}
}

export const cart = new CartState();
