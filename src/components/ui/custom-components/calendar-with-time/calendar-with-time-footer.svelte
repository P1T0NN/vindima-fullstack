<script lang="ts">
	// LIBRARIES
	import type { CalendarDate } from '@internationalized/date';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { PICKUP_TIME_ZONE } from '@/shared/features/checkout/config.js';
	import { formatPickupTime } from '@/shared/features/checkout/utils/formatPickupTime.js';

	type Props = {
		value?: CalendarDate;
		selectedTime?: string | null;
	};

	let { value, selectedTime }: Props = $props();

	const formattedDate = $derived(
		value?.toDate(PICKUP_TIME_ZONE).toLocaleDateString('es-MX', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}) ?? ''
	);
</script>

<Card.Footer class="flex flex-col gap-4 border-t px-6 py-5! md:flex-row">
	<p class="text-sm">
		{#if value && selectedTime}
			Recogerás tu pedido el
			<span class="font-medium">{formattedDate}</span>
			a las <span class="font-medium">{formatPickupTime(selectedTime)}</span>.
		{:else if value}
			Selecciona una hora para continuar.
		{:else}
			Selecciona un día y una hora para recoger tu pedido.
		{/if}
	</p>
</Card.Footer>
