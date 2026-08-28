<script lang="ts">
	// LIBRARIES
	import { today, type CalendarDate } from '@internationalized/date';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import Calendar from '@/components/ui/calendar/calendar.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import CalendarWithTimeFooter from './calendar-with-time-footer.svelte';

	// UTILS
	import { PICKUP_TIME_SLOTS, PICKUP_TIME_ZONE } from '@/shared/features/checkout/config.js';
	import { formatPickupTime } from '@/shared/features/checkout/utils/formatPickupTime.js';
	import { isPickupDate } from '@/shared/features/checkout/utils/isPickupDate.js';

	type Props = {
		value?: CalendarDate;
		selectedTime?: string | null;
		blockedTimes?: readonly string[];
		availabilityLoading?: boolean;
		availabilityError?: boolean;
	};

	let {
		value = $bindable<CalendarDate | undefined>(),
		selectedTime = $bindable<string | null>(null),
		blockedTimes = [],
		availabilityLoading = false,
		availabilityError = false
	}: Props = $props();

	const minimumDate = today(PICKUP_TIME_ZONE);
</script>

<Card.Root class="gap-0 p-0">
	<Card.Content class="relative p-0 md:pe-48">
		<div class="p-6">
			<Calendar
				type="single"
				bind:value
				placeholder={minimumDate}
				minValue={minimumDate}
				isDateDisabled={(date) => !isPickupDate(date.toString())}
				calendarLabel="Fecha de recogida"
				locale="es-MX"
				weekStartsOn={1}
				class="bg-transparent p-0 [--cell-size:--spacing(10)] **:data-outside-month:hidden data-unavailable:line-through data-unavailable:opacity-100 md:[--cell-size:--spacing(12)]"
				weekdayFormat="short"
			/>
		</div>
		<div
			class="no-scrollbar inset-y-0 end-0 flex max-h-72 w-full scroll-pb-6 flex-col gap-4 overflow-y-auto border-t p-6 md:absolute md:max-h-none md:w-48 md:border-s md:border-t-0"
		>
			<div class="grid gap-2">
				{#each PICKUP_TIME_SLOTS as time (time)}
					{@const blocked = blockedTimes.includes(time)}
					{@const label = formatPickupTime(time)}
					<Button
						type="button"
						variant={selectedTime === time && !blocked ? 'default' : 'outline'}
						aria-pressed={selectedTime === time}
						aria-label={`${label}, ${blocked ? 'no disponible' : 'disponible'}`}
						disabled={!value || availabilityLoading || availabilityError || blocked}
						onclick={() => (selectedTime = time)}
						class={blocked
							? 'w-full text-muted-foreground line-through decoration-1 shadow-none'
							: 'w-full shadow-none'}
					>
						{label}
					</Button>
				{/each}
			</div>

			{#if value && availabilityLoading}
				<p class="text-xs text-muted-foreground" role="status">Consultando disponibilidad...</p>
			{:else if value && availabilityError}
				<p class="text-xs text-destructive" role="alert">No pudimos consultar los horarios.</p>
			{:else if value && blockedTimes.length === PICKUP_TIME_SLOTS.length}
				<p class="text-xs text-muted-foreground" role="status">No hay horarios disponibles.</p>
			{/if}
		</div>
	</Card.Content>

	<CalendarWithTimeFooter {value} {selectedTime} />
</Card.Root>
