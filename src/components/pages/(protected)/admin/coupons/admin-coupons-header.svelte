<script lang="ts">
	// COMPONENTS
	import AddCouponDialog from '@/features/coupons/components/add-coupon-dialog/add-coupon-dialog.svelte';
</script>

<header class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
	<div class="flex flex-col gap-1">
		<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">Marketing</p>

		<h1 class="text-2xl font-semibold tracking-tight">Cupones</h1>

		<p class="max-w-prose text-sm text-muted-foreground">
			Crea y gestiona códigos de descuento que los clientes puedan canjear al pagar.
		</p>
	</div>

	<AddCouponDialog />
</header>
