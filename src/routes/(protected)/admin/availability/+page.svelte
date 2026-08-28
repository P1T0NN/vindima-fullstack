<script lang="ts">
	// LIBRARIES
	import { today, type CalendarDate } from '@internationalized/date';

	// CONFIG
	import { PICKUP_TIME_ZONE } from '@/shared/features/checkout/config.js';

	// COMPONENTS
	import AvailabilityCalendar from '@/components/pages/(protected)/admin/availability/availability-calendar.svelte';
	import AvailabilityCalendarSelected from '@/components/pages/(protected)/admin/availability/availability-calendar-selected.svelte';
	import AvailabilityCalendarUnselected from '@/components/pages/(protected)/admin/availability/availability-calendar-unselected.svelte';
	import AvailabilityHeader from '@/components/pages/(protected)/admin/availability/availability-header.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import * as Card from '@/components/ui/card/index.js';

	// UTILS
	import { isPickupDate } from '@/shared/features/checkout/utils/isPickupDate.js';

	const currentDate = today(PICKUP_TIME_ZONE);
	const initialDate = isPickupDate(currentDate.toString())
		? currentDate
		: currentDate.add({ days: 1 });

	let selectedDate = $state<CalendarDate | undefined>(initialDate);
</script>

<SvelteHead
	title="Disponibilidad"
	noindex
	description="Configura los horarios disponibles para la recogida de pedidos."
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AvailabilityHeader />

	<Card.Root class="gap-0 overflow-hidden p-0">
		<Card.Content class="grid p-0 lg:grid-cols-[auto_1fr]">
			<div class="border-b p-4 sm:p-6 lg:border-r lg:border-b-0">
				<AvailabilityCalendar bind:selectedDate />
			</div>

			<div class="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
				{#if selectedDate}
					<AvailabilityCalendarSelected {selectedDate} />
				{:else}
					<AvailabilityCalendarUnselected />
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</section>
