<script lang="ts">
	// LIBRARIES
	import { useMutation } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel.js';

	let { couponId, active }: { couponId: Id<'coupons'>; active: boolean } = $props();

	let pending = $state(false);
	const setCouponActive = useMutation(api.tables.coupons.mutations.setCouponActive.setCouponActive);

	async function toggleCouponActive(): Promise<void> {
		if (pending) return;

		pending = true;
		const nextActive = !active;
		try {
			await setCouponActive({ couponId, active: nextActive });
			toastMessage({
				type: 'success',
				message: nextActive ? 'Cupón activado.' : 'Cupón desactivado.'
			});
		} catch (error) {
			toastMessage({
				type: 'error',
				error,
				message: 'No pudimos actualizar este cupón.'
			});
		} finally {
			pending = false;
		}
	}
</script>

<button
	type="button"
	class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
	onclick={() => void toggleCouponActive()}
	disabled={pending}
>
	<span
		class={active ? 'icon-[lucide--circle-pause] size-4' : 'icon-[lucide--circle-play] size-4'}
		aria-hidden="true"
	></span>
	{active ? 'Desactivar' : 'Activar'}
</button>
