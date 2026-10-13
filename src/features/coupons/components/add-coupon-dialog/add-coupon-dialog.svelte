<script lang="ts">
	// COMPONENTS
	import AddCouponDialogForm from './add-coupon-dialog-form.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';

	// NativeDialog keeps its children mounted after closing; recreating the form
	// on every open resets draft values to the defaults.
	let formKey = $state(0);
</script>

<NativeDialog label="Crear cupón">
	{#snippet trigger({ open })}
		<Button
			type="button"
			onclick={() => {
				formKey += 1;
				open();
			}}
		>
			<span class="icon-[lucide--plus]" data-icon="inline-start" aria-hidden="true"></span>
			Agregar cupón
		</Button>
	{/snippet}

	{#snippet children({ close })}
		{#key formKey}
			<AddCouponDialogForm {close} />
		{/key}
	{/snippet}
</NativeDialog>
