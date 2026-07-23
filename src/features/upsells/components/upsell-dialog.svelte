<script lang="ts">
	// Add-to-cart suggestion dialog (UpsellsSystemDesign.md §7). A burgundy-headed "maridaje"
	// aside: 1..MAX pairing cards, each one-tap "Agregar"; every close path lands the shopper in
	// their cart. Composes bits-ui `Dialog` inline; colours are semantic tokens (accent/primary).

	// LIBRARIES
	import { Dialog } from 'bits-ui';

	// CLASSES
	import { upsells } from '@/features/upsells/upsells.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';
</script>

<Dialog.Root bind:open={upsells.isOpen} onOpenChange={(open) => upsells.handleOpenChange(open)}>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-foreground/58 duration-100 supports-backdrop-filter:backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
		/>
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-full max-w-150 -translate-x-1/2 -translate-y-1/2 flex-col overflow-x-hidden overflow-y-auto rounded-xl bg-card text-foreground shadow-2xl duration-100 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95"
		>
			<!-- Header (burgundy) -->
			<div class="flex items-start justify-between gap-4 bg-accent px-7 py-6 sm:px-8">
				<div class="min-w-0">
					<p class="mb-2 text-[10.5px] font-medium tracking-[0.22em] text-primary uppercase">
						✦ Maridaje recomendado
					</p>
					<Dialog.Title
						class="font-display text-[28px] leading-[1.05] font-semibold tracking-wide text-accent-foreground uppercase"
					>
						¡Buena elección!
					</Dialog.Title>
					<p class="mt-2 text-[13px] leading-relaxed text-[#C8C8C8]">
						Agregaste <strong class="font-semibold text-accent-foreground">{upsells.addedName}</strong>
						— marídalo con estos platillos:
					</p>
				</div>

				<Dialog.Close
					class="flex size-8.5 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary transition-colors hover:bg-primary/10"
					aria-label="Cerrar"
				>
					<XIcon class="size-4" strokeWidth={1.6} />
				</Dialog.Close>
			</div>

			<!-- Pairing cards -->
			<div
				class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 px-7 pt-6 pb-5 sm:px-8"
			>
				{#each upsells.items as item (item.ref)}
					<div class="flex flex-col gap-1.75 rounded-lg border border-primary bg-white p-4 pb-3.5">
						<span
							class="font-display text-[19px] leading-tight font-semibold tracking-wide text-accent uppercase"
						>
							{item.name}
						</span>
						{#if item.description}
							<span class="text-xs leading-relaxed text-muted-foreground">{item.description}</span>
						{/if}
						<Button
							size="sm"
							onclick={() => upsells.addItem(item.ref)}
							class="mt-auto w-full justify-center"
						>
							Agregar
						</Button>
					</div>
				{/each}
			</div>

			<!-- Promo strip -->
			<div
				class="mx-7 mb-4 flex items-center gap-3.5 rounded-md border border-primary/45 bg-primary/12 px-4 py-3.5 sm:mx-8"
			>
				<span class="font-display shrink-0 text-[26px] leading-none font-semibold text-[#b8902f]">
					−10%
				</span>
				<span class="text-[12.5px] leading-[1.55] text-accent">
					de descuento al agregar una tabla, hogaza o cualquier alimento. Y además: −10% desde 3
					botellas · −12% en caja de 12.
				</span>
			</div>

			<!-- Dismiss — same as ✕ / overlay: close and go to the cart, without adding an upsell. -->
			<div class="px-7 pb-6 sm:px-8">
				<Dialog.Close class="w-full">
					{#snippet child({ props })}
						<Button
							{...props}
							variant="ghost"
							class="w-full justify-center text-muted-foreground hover:text-foreground"
						>
							No, gracias
						</Button>
					{/snippet}
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
