<script lang="ts">
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { Field, FieldLabel } from '@/components/ui/field/index.js';
	import { normalizeCouponCode } from '@/shared/features/coupons/utils/normalizeCouponCode.js';
	import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import type { AppliedCoupon } from '@/shared/features/coupons/types/couponTypes.js';

	let {
		subtotalMinor,
		email,
		authenticated,
		signInHref,
		validate,
		disabled = false,
		applied = $bindable<AppliedCoupon | null>(null),
		checking = $bindable(false)
	}: {
		subtotalMinor: number;
		email: string;
		authenticated: boolean;
		signInHref: string;
		validate: (code: string) => Promise<AppliedCoupon>;
		disabled?: boolean;
		applied?: AppliedCoupon | null;
		checking?: boolean;
	} = $props();

	let code = $state('');
	let errorMessage = $state('');
	const requiresSignIn = $derived(COUPONS_CONFIG.COUPONS_REQUIRE_SIGN_IN && !authenticated);
	const context = $derived(`${subtotalMinor}:${email.trim().toLowerCase()}:${authenticated}`);

	async function applyCoupon(): Promise<void> {
		const normalized = normalizeCouponCode(code);
		if (!normalized || checking || disabled) return;
		const checkedContext = context;
		checking = true;
		errorMessage = '';
		try {
			const result = await validate(normalized);
			if (checkedContext !== context) return;
			applied = result;
			code = '';
			toastMessage({ type: 'success', message: `Cupón ${result.code} aplicado` });
		} catch (error) {
			if (checkedContext !== context) return;
			applied = null;
			errorMessage =
				error instanceof Error ? error.message : 'No pudimos aplicar el cupón. Inténtalo de nuevo.';
		} finally {
			checking = false;
		}
	}
</script>

{#if applied}
	<div
		class="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm"
		role="status"
	>
		<span class="flex min-w-0 items-center gap-2 font-medium">
			<span class="icon-[lucide--ticket-percent] size-4 shrink-0" aria-hidden="true"></span>
			<span class="truncate">Cupón {applied.code} aplicado</span>
		</span>
		<Button
			type="button"
			variant="ghost"
			size="icon"
			{disabled}
			onclick={() => (applied = null)}
			aria-label={`Quitar cupón ${applied.code}`}
		>
			<span class="icon-[lucide--x]" aria-hidden="true"></span>
		</Button>
	</div>
{:else if requiresSignIn}
	<div class="flex flex-col items-start gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
		<span class="flex items-center gap-2 text-muted-foreground">
			<span class="icon-[lucide--ticket-percent] size-4 shrink-0" aria-hidden="true"></span>
			Inicia sesión para usar un cupón.
		</span>
		<Button href={signInHref} variant="outline" size="sm">Iniciar sesión</Button>
	</div>
{:else}
	<Field data-invalid={errorMessage ? true : undefined}>
		<FieldLabel for="coupon-code">Código de cupón</FieldLabel>
		<div class="flex gap-2">
			<Input
				id="coupon-code"
				bind:value={code}
				placeholder="Ingresa tu código"
				autocomplete="off"
				autocapitalize="characters"
				maxlength={COUPONS_CONFIG.maxCodeLength}
				disabled={disabled || checking}
				aria-invalid={errorMessage ? true : undefined}
				aria-describedby={errorMessage ? 'coupon-error' : undefined}
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						void applyCoupon();
					}
				}}
			/>
			<Button
				type="button"
				variant="outline"
				onclick={() => void applyCoupon()}
				disabled={disabled || checking || !code.trim()}
			>
				{#if checking}<Spinner data-icon="inline-start" />{/if}
				{checking ? 'Aplicando...' : 'Aplicar'}
			</Button>
		</div>
		{#if errorMessage}<p id="coupon-error" class="text-sm text-destructive" role="alert">
				{errorMessage}
			</p>{/if}
	</Field>
{/if}
