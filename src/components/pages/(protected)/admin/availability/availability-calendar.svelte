<script lang="ts">
	// LIBRARIES
	import {
		endOfMonth,
		isEqualMonth,
		startOfMonth,
		today,
		type CalendarDate,
		type DateValue
	} from '@internationalized/date';
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { getPickupTimeSlots, PICKUP_TIME_ZONE } from '@/shared/features/checkout/config.js';

	// COMPONENTS
	import Calendar from '@/components/ui/calendar/calendar.svelte';
	import * as CalendarParts from '@/components/ui/calendar/index.js';
	import { ErrorComponent } from '@/components/ui/custom-components/error-component/index.js';

	// UTILS
	import { isPickupDate } from '@/shared/features/checkout/utils/isPickupDate.js';
	import { cn } from '@/utils/utils.js';

	type Props = {
		selectedDate?: CalendarDate;
	};

	let { selectedDate = $bindable<CalendarDate | undefined>() }: Props = $props();

	const currentDate = today(PICKUP_TIME_ZONE);
	let visibleMonth = $state<CalendarDate>(selectedDate ?? currentDate);

	const monthRange = $derived({
		from: startOfMonth(visibleMonth).toString(),
		to: endOfMonth(visibleMonth).toString()
	});
	const availabilityQuery = useQuery(
		api.tables.availability.queries.fetchAvailability.fetchAvailability,
		() => monthRange
	);
	const availability = $derived(
		availabilityQuery.data?.from === monthRange.from && availabilityQuery.data?.to === monthRange.to
			? availabilityQuery.data
			: null
	);
	const blockedByDate = $derived(
		new Map((availability?.dates ?? []).map((entry) => [entry.date, entry.blockedTimes]))
	);

	function blockedCount(date: DateValue): number {
		const blockedTimes = blockedByDate.get(date.toString()) ?? [];
		return getPickupTimeSlots(date.toString()).filter((time) => blockedTimes.includes(time)).length;
	}

	function setVisibleMonth(month: DateValue): void {
		visibleMonth = month as CalendarDate;
		if (selectedDate && !isEqualMonth(selectedDate, month)) selectedDate = undefined;
	}
</script>

{#if availabilityQuery.error}
	<ErrorComponent
		variant="content"
		showRetry={false}
		title="No se pudo cargar la disponibilidad"
		description="Algo salió mal. Inténtalo de nuevo."
	/>
{:else}
	<Calendar
		type="single"
		bind:value={selectedDate}
		bind:placeholder={() => visibleMonth, setVisibleMonth}
		minValue={currentDate}
		isDateDisabled={(date) => !isPickupDate(date.toString())}
		calendarLabel="Fecha de recogida"
		locale="es-MX"
		weekStartsOn={1}
		weekdayFormat="short"
		class="bg-transparent p-0 [--cell-size:--spacing(10)] **:data-outside-month:hidden data-unavailable:line-through data-unavailable:opacity-100 sm:[--cell-size:--spacing(12)]"
	>
		{#snippet day({ day })}
			<CalendarParts.Day
				class={cn(
					blockedCount(day) > 0 &&
						"relative after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current after:content-['']"
				)}
			/>
		{/snippet}
	</Calendar>
{/if}
