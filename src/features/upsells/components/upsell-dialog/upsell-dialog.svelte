<script lang="ts">
	// SVELTE
	import { onMount } from 'svelte';

	// Add-to-cart pairing dialog (UpsellsSystemDesign.md §7). Framed as the house recommending
	// what completes the shopper's choice, not a hard sell. One-tap "Agregar"; every close path
	// lands the shopper in their cart. Native <dialog> (NativeDialog) — Esc, backdrop, focus trap.

	// CLASSES
	import { upsells } from '@/features/upsells/classes/upsells.svelte';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import UpsellDialogHeader from './upsell-dialog-header.svelte';
	import UpsellDialogItem from './upsell-dialog-item.svelte';
	import UpsellDialogCloseButton from './upsell-dialog-close-button.svelte';

	let dialog: NativeDialog;

	onMount(() =>
		upsells.connectDialog(
			() => dialog.open(),
			() => dialog.close()
		)
	);

	function dismiss(close: () => void) {
		close();
		upsells.handleOpenChange(false);
	}
</script>

<NativeDialog bind:this={dialog}>
	{#snippet children({ close })}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={() => dismiss(close)}
			aria-label="Cerrar"
			class="absolute top-4 right-4 text-muted-foreground hover:text-accent"
		>
			<span class="icon-[lucide--x] size-4" aria-hidden="true"></span>
		</Button>

		<UpsellDialogHeader />

		<!-- Pairing suggestions: image carries the desire, price removes the hesitation. -->
		<div class="flex flex-col divide-y divide-border">
			{#each upsells.items as item (item.ref)}
				<UpsellDialogItem {item} />
			{/each}
		</div>

		<!-- The clincher: the suggested action (add a pairing) is the same action that unlocks the saving. -->
		<div class="mt-4 flex items-center justify-center gap-2 text-center">
			<span class="icon-[lucide--sparkles] size-3.5 shrink-0 text-chart-2" aria-hidden="true"
			></span>
			<p class="text-[12.5px] leading-snug text-accent">
				Suma un alimento y <strong class="font-semibold">ahorras 10%</strong> en todo tu pedido.
			</p>
		</div>

		<UpsellDialogCloseButton onClose={() => dismiss(close)} />
	{/snippet}
</NativeDialog>
