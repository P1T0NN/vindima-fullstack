<script lang="ts">
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { toastMessage } from '@/utils/toastMessage.js';
	import type { Id } from '@/convex/_generated/dataModel.js';

	let { couponId, couponCode }: { couponId: Id<'coupons'>; couponCode: string } = $props();
	let pending = $state(false);
	const deleteCoupon = useMutation(api.tables.coupons.mutations.deleteCoupon.deleteCoupon);

	async function remove(): Promise<void> {
		if (pending) return;
		pending = true;
		try {
			await deleteCoupon({ couponId });
			toastMessage({ type: 'success', message: 'Cupón eliminado.' });
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: 'No pudimos eliminar el cupón. Inténtalo de nuevo.'
			});
		} finally {
			pending = false;
		}
	}
</script>

<ActionButton
	function={remove}
	variant="ghost"
	class="w-full justify-start text-destructive"
	isDestructive
	isPending={pending}
	title={`¿Eliminar el cupón ${couponCode}?`}
	description="Esta acción no se puede deshacer. Los pedidos existentes conservan su descuento."
>
	<span class="icon-[lucide--trash-2]" aria-hidden="true"></span>Eliminar cupón
</ActionButton>
