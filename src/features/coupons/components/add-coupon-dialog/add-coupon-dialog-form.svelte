<script lang="ts">
	import { api } from '@/convex/_generated/api';
	import { Button } from '@/components/ui/button/index.js';
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { Switch } from '@/components/ui/switch/index.js';
	import {
		Field,
		FieldContent,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/components/ui/field/index.js';
	import AddCouponDialogExpiryField from './add-coupon-dialog-expiry-field.svelte';
	import { couponFields } from '@/features/coupons/forms/createCouponFields.js';
	import { saveCouponFormSchema } from '@/shared/features/coupons/schemas/couponSchemas.js';
	import { zodIssuesToFieldErrors } from '@/shared/features/validations/utils/zodFieldErrors.js';

	let { close }: { close: () => void } = $props();
	let values = $state<Record<string, string | boolean | number | undefined>>({
		active: true,
		onePerCustomer: false
	});
	let submitting = $state(false);

	function validate(input: typeof values): Partial<Record<string, string>> {
		const parsed = saveCouponFormSchema.safeParse(input);
		return parsed.success ? {} : zodIssuesToFieldErrors(parsed.error.issues);
	}
</script>

<div class="flex flex-col gap-5 p-6">
	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-lg font-semibold">Crear cupón</h2>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={close}
				disabled={submitting}
				aria-label="Cerrar"
			>
				<span class="icon-[lucide--x]" aria-hidden="true"></span>
			</Button>
		</div>
		<p class="text-sm text-muted-foreground">
			Crea un código de descuento para usar al finalizar la compra.
		</p>
	</div>
	<Form
		id="add-coupon-form"
		function={api.tables.coupons.mutations.saveCoupon.saveCoupon}
		fields={couponFields}
		{validate}
		prepareArgs={() => saveCouponFormSchema.parse(values)}
		bind:values
		bind:submitting
		resetOnSuccess={false}
		onSuccess={() => close()}
		successMessage="Cupón creado."
		errorMessage="No pudimos crear el cupón. Comprueba que el código no exista e inténtalo de nuevo."
	>
		{#snippet renderCustomField(field, errors)}
			{#if field.name === 'expiresAt'}
				<Field data-invalid={errors.expiresAt ? true : undefined}>
					<p class="text-sm font-medium">Vencimiento</p>
					<AddCouponDialogExpiryField
						value={String(values.expiresAt ?? '')}
						onValueChange={(value) => (values.expiresAt = value)}
						disabled={submitting}
					/>
					<FieldDescription>Opcional. El cupón vence al final de ese día (UTC).</FieldDescription>
					{#if errors.expiresAt}<FieldError>{errors.expiresAt}</FieldError>{/if}
				</Field>
			{:else}
				<Field orientation="horizontal">
					<FieldContent>
						<FieldLabel for={field.name}
							>{field.name === 'active' ? 'Activo' : 'Un uso por cliente'}</FieldLabel
						>
						<FieldDescription
							>{field.name === 'active'
								? 'Permite usar este cupón al finalizar la compra.'
								: 'Cada cuenta, dispositivo o correo electrónico puede usarlo una sola vez.'}</FieldDescription
						>
					</FieldContent>
					<Switch
						id={field.name}
						checked={values[field.name] === true}
						onCheckedChange={(checked) => (values[field.name] = checked)}
						disabled={submitting}
					/>
				</Field>
			{/if}
		{/snippet}
	</Form>
	<div class="flex justify-end gap-2">
		<Button type="button" variant="outline" onclick={close} disabled={submitting}>Cancelar</Button>
		<Button type="submit" form="add-coupon-form" disabled={submitting}>
			{#if submitting}<Spinner data-icon="inline-start" />{/if}
			{submitting ? 'Creando...' : 'Crear cupón'}
		</Button>
	</div>
</div>
