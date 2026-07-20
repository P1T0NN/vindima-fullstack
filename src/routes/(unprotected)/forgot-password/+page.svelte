<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import PasswordResetForm from '@/features/auth/components/password-reset-form/password-reset-form.svelte';
</script>

<SvelteHead
	title="Restablecer contraseña"
	noindex
	description="Restablece la contraseña de tu cuenta de Vindima."
/>

<div class="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
	<div class="w-full max-w-sm">
		<PasswordResetForm />
	</div>
</div>
