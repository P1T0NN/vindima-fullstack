<script lang="ts">
	// SVELTEKIT
	import { goto } from '$app/navigation';

	// LIBRARIES
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import { SvelteMap } from 'svelte/reactivity';
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';

	// CONFIG
	import { CART_CONFIG, FEATURES } from '@/shared/config';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Sheet, SheetContent, SheetHeader, SheetFooter, SheetTitle } from '@/components/ui/sheet';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import CartLine from './cart-line.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { appGoto } from '@/utils/app-navigation.js';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	// ICONS
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';

	// One catalog subscription per surface (§5) — only while the sheet is open. Live price/name
	// edits push in automatically; resolution flows down to each <CartLine> as a prop.
	const refs = $derived(cart.lines.map((l) => l.productRef));
	const productsQuery = useQuery(
		api.tables.cart.queries.resolveCartProducts.resolveCartProducts,
		() => (cart.isOpen && refs.length > 0 ? { refs } : 'skip')
	);

	const byRef = $derived.by(() => {
		const map = new SvelteMap<string, ResolvedCartProduct>();
		for (const row of productsQuery.data ?? []) map.set(row.productRef, row);
		return map;
	});

	// Self-healing cart: lines whose product got delisted resolve with a null price —
	// drop them automatically (guest + authed) and toast once.
	$effect(() => {
		const rows = productsQuery.data;
		if (rows) cart.pruneUnavailable(rows);
	});

	/** Locale-agnostic unavailable fallback for a ref not yet in the resolved map. */
	function fallback(ref: string): ResolvedCartProduct {
		return {
			productRef: ref,
			name: ref,
			imageUrl: null,
			unitPriceMinor: null,
			currency: CART_CONFIG.CURRENCY
		};
	}

	const resolved = $derived(
		cart.lines.map((line) => ({
			line,
			product: byRef.get(line.productRef) ?? fallback(line.productRef)
		}))
	);
	const purchasable = $derived(resolved.filter((r) => r.product.unitPriceMinor !== null));
	const subtotalMinor = $derived(
		purchasable.reduce((sum, r) => sum + r.product.unitPriceMinor! * r.line.qty, 0)
	);
	const currency = $derived(purchasable[0]?.product.currency ?? CART_CONFIG.CURRENCY);
	const hasUnavailable = $derived(resolved.some((r) => r.product.unitPriceMinor === null));
	const canCheckout = $derived(subtotalMinor > 0);

	const productsLoading = $derived(
		cart.isOpen && refs.length > 0 && productsQuery.data === undefined
	);
	const showSkeleton = $derived((cart.loading && cart.lines.length === 0) || productsLoading);
	const showEmpty = $derived(!cart.loading && cart.lines.length === 0);

	function checkout() {
		cart.close();
		goto(UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT);
	}

	function browseShop() {
		cart.close();
		appGoto(UNPROTECTED_PAGE_ENDPOINTS.SHOP);
	}
</script>

<Sheet bind:open={cart.isOpen}>
	<SheetContent side="right" class="w-full gap-0 p-0 sm:max-w-105">
		<SheetHeader class="border-b border-border p-4">
			<SheetTitle class="text-base font-semibold">
				Carrito{#if cart.count > 0}<span class="text-muted-foreground"> ({cart.count})</span>{/if}
			</SheetTitle>
		</SheetHeader>

		<!-- Scrollable line list -->
		<div class="min-h-0 flex-1 overflow-y-auto px-4">
			{#if showSkeleton}
				{#each [0, 1] as i (i)}
					<div class="flex gap-3 py-4">
						<Skeleton class="size-16 shrink-0 rounded-md" />
						<div class="flex-1 space-y-2 py-1">
							<Skeleton class="h-4 w-2/3" />
							<Skeleton class="h-8 w-28" />
						</div>
					</div>
				{/each}
			{:else if showEmpty}
				<div class="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
					<ShoppingBagIcon class="size-12 text-muted-foreground/40" strokeWidth={1.2} />
					<p class="text-sm text-muted-foreground">Tu carrito está vacío</p>
					<Button onclick={browseShop}>Explorar la tienda</Button>
				</div>
			{:else}
				<ul class="divide-y divide-border">
					{#each resolved as { line, product } (line.productRef)}
						<li animate:flip={{ duration: 200 }} transition:slide={{ duration: 200 }}>
							<CartLine {line} {product} />
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if !showEmpty && !showSkeleton}
			<SheetFooter class="gap-3 border-t border-border p-4">
				<div class="flex items-baseline justify-between">
					<span class="text-sm font-medium text-muted-foreground">Subtotal</span>
					<span class="text-xl font-semibold text-foreground tabular-nums">
						{formatMoneyMinor(subtotalMinor, currency)}
					</span>
				</div>
				<p class="text-xs text-muted-foreground">
					El envío y los impuestos se calculan al finalizar la compra.{#if hasUnavailable}&nbsp;Los
					productos no disponibles no se incluyen en el subtotal.{/if}
				</p>

				{#if FEATURES.CHECKOUT}
					<Button class="h-11 w-full" onclick={checkout} disabled={!canCheckout}
						>Finalizar compra</Button
					>
				{/if}
				<Button
					variant="ghost"
					size="sm"
					class="w-full text-muted-foreground"
					onclick={() => cart.close()}
				>
					Seguir comprando
				</Button>
			</SheetFooter>
		{/if}
	</SheetContent>
</Sheet>
