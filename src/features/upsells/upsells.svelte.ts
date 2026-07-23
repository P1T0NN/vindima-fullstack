// Client controller for add-to-cart upsell suggestions (UpsellsSystemDesign.md §5, §7).
// Module singleton, same pattern as `cart` / `header`. Seeded once from the shop loader with
// the resolved catalog; deciding whether to show a dialog is pure, synchronous, zero-latency.
// Consumers (the product grid, the dialog) never branch on rules — they call these methods.

// SVELTEKIT IMPORTS
import { browser } from '$app/environment';

// CONFIG
import { UPSELLS_CONFIG } from '@/shared/config';

// LIBRARIES
import { toast } from 'svelte-sonner';

// STATE
import { cart } from '@/features/cart/cart.svelte';

// UTILS
import { matchUpsellRule, visibleUpsellItems } from '@/shared/features/upsells/utils/upsellsUtils';

// TYPES
import type {
	AddedProduct,
	UpsellCatalogItem,
	UpsellCatalogRule
} from '@/shared/features/upsells/types/upsellsTypes';

/** sessionStorage key holding the ids of rules already shown this session (§5.4). */
const SHOWN_KEY = 'upsells.shown.v1';

class UpsellsState {
	/** Resolved, enabled rules — seeded from the shop loader (one-shot, no subscription). */
	#rules: UpsellCatalogRule[] = [];

	isOpen = $state(false);
	/** Items rendered in the currently open dialog (already filtered + capped). */
	items = $state<UpsellCatalogItem[]>([]);
	/** Display name of the product that was just added — shown in the dialog header. */
	addedName = $state('');

	/** Seed the catalog. Idempotent; called wherever the product grid mounts. */
	setCatalog(rules: UpsellCatalogRule[]) {
		this.#rules = rules;
	}

	/**
	 * After a product was added to the cart, maybe open the suggestion dialog. Returns `true`
	 * if it opened (the caller then skips `cart.open()`), `false` otherwise (caller opens the
	 * cart as usual). All filtering happens here so the grid stays dumb.
	 */
	maybeShow(added: AddedProduct, addedRef: string): boolean {
		if (this.#rules.length === 0) return false;

		const rule = matchUpsellRule(added, this.#rules);
		if (!rule || this.#alreadyShown(rule.id)) return false;

		const cartRefs = cart.lines.map((l) => l.productRef);
		const items = visibleUpsellItems(rule, cartRefs, addedRef, UPSELLS_CONFIG.MAX_ITEMS_PER_RULE);
		if (items.length === 0) return false;

		this.items = items;
		this.addedName = added.name;
		this.isOpen = true;
		this.#markShown(rule.id);
		return true;
	}

	/**
	 * One-tap add from the dialog: add to the cart (optimistic), confirm with a toast, close the
	 * dialog and open the cart so the shopper sees what they built. No chained dialog.
	 */
	addItem(ref: string) {
		const item = this.items.find((i) => i.ref === ref);
		cart.add(ref);
		toast.success(`Se agregó ${item?.name ?? 'el producto'} a tu carrito`);
		this.isOpen = false;
		cart.open();
	}

	/**
	 * Handles every dismiss (bits-ui `onOpenChange`, plus the "No, gracias" button): ✕ / ESC /
	 * overlay / "No, gracias" all close the dialog and open the cart — the shopper already added
	 * a product, so they land on it whether or not they took an upsell.
	 */
	handleOpenChange(open: boolean) {
		if (open) return;
		this.isOpen = false;
		cart.open();
	}

	#alreadyShown(id: string): boolean {
		if (!UPSELLS_CONFIG.SHOW_ONCE_PER_SESSION || !browser) return false;
		try {
			const raw = sessionStorage.getItem(SHOWN_KEY);
			return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
		} catch {
			return false; // storage blocked (private mode) → show normally
		}
	}

	#markShown(id: string) {
		if (!UPSELLS_CONFIG.SHOW_ONCE_PER_SESSION || !browser) return;
		try {
			const raw = sessionStorage.getItem(SHOWN_KEY);
			const arr = raw ? (JSON.parse(raw) as string[]) : [];
			if (!arr.includes(id)) {
				arr.push(id);
				sessionStorage.setItem(SHOWN_KEY, JSON.stringify(arr));
			}
		} catch {
			// storage blocked — the dialog just isn't de-duped this session; never crash.
		}
	}
}

export const upsells = new UpsellsState();
