<script lang="ts">
	// LIBRARIES
	import type { CalendarDate } from '@internationalized/date';
	import { useMutation, useQuery } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { getPickupTimeSlots, PICKUP_TIME_ZONE } from '@/shared/features/checkout/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { formatPickupTime } from '@/shared/features/checkout/utils/formatPickupTime.js';
	import { setPickupTimeBlocked } from '@/shared/features/checkout/utils/setPickupTimeBlocked.js';
	import { hasErrorMessage } from '@/shared/utils/errorMessage.js';
	import { toastMessage } from '@/utils/toastMessage.js';
	import { cn } from '@/utils/utils.js';

	type Props = {
		selectedDate: CalendarDate;
	};

	let { selectedDate }: Props = $props();
	let saving = $state(false);

	const dateFormatter = new Intl.DateTimeFormat('es-MX', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: PICKUP_TIME_ZONE
	});
	const selectedDateKey = $derived(selectedDate.toString());
	const timeSlots = $derived(getPickupTimeSlots(selectedDateKey));
	const availabilityQuery = useQuery(
		api.tables.availability.queries.fetchAvailability.fetchAvailability,
		() => ({ from: selectedDateKey, to: selectedDateKey })
	);
	const availability = $derived(
		availabilityQuery.data?.from === selectedDateKey &&
			availabilityQuery.data?.to === selectedDateKey
			? availabilityQuery.data
			: null
	);
	const selectedBlockedTimes = $derived(
		availability?.dates.find((entry) => entry.date === selectedDateKey)?.blockedTimes ?? []
	);
	const blockedSlotCount = $derived(
		timeSlots.filter((time) => selectedBlockedTimes.includes(time)).length
	);
	const allDayBlocked = $derived(timeSlots.length > 0 && blockedSlotCount === timeSlots.length);
	const selectedDateLabel = $derived(dateFormatter.format(selectedDate.toDate(PICKUP_TIME_ZONE)));

	const setAvailability = useMutation(
		api.tables.availability.mutations.setAvailability.setAvailability
	);

	async function saveBlockedTimes(blockedTimes: string[], successMessage: string): Promise<void> {
		if (saving || !availability || availabilityQuery.error) return;
		saving = true;
		try {
			const result = await setAvailability({ date: selectedDateKey, blockedTimes });
			if (!result.success) {
				toastMessage({ type: 'error', error: null, message: result.message });
			} else {
				toastMessage({ type: 'success', message: successMessage });
			}
		} catch (error) {
			if (error instanceof ConvexError && hasErrorMessage(error.data)) {
				toastMessage({
					type: 'error',
					error,
					message: error.data.message
				});
			} else if (isRateLimitError(error)) {
				toastMessage({ type: 'error', error, message: '' });
			} else {
				toastMessage({
					type: 'error',
					error,
					message: 'No pudimos guardar la disponibilidad. Inténtalo de nuevo.'
				});
			}
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
	<div class="min-w-0">
		<h2 class="font-semibold capitalize">{selectedDateLabel}</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			{blockedSlotCount === 0
				? 'Todos los horarios están disponibles.'
				: `${blockedSlotCount} de ${timeSlots.length} horarios bloqueados.`}
		</p>
	</div>

	<Button
		type="button"
		variant="outline"
		size="sm"
		disabled={saving || !availability}
		onclick={() =>
			saveBlockedTimes(
				allDayBlocked ? [] : [...timeSlots],
				allDayBlocked ? 'Has desbloqueado todo el día.' : 'Has bloqueado todo el día.'
			)}
	>
		{allDayBlocked ? 'Liberar todo el día' : 'Bloquear todo el día'}
	</Button>
</div>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
	{#each timeSlots as time (time)}
		{@const blocked = selectedBlockedTimes.includes(time)}
		<Button
			type="button"
			variant={blocked ? 'secondary' : 'outline'}
			aria-pressed={blocked}
			aria-label={`${formatPickupTime(time)}, ${blocked ? 'bloqueado' : 'disponible'}`}
			disabled={saving || !availability}
			onclick={() =>
				saveBlockedTimes(
					setPickupTimeBlocked(selectedBlockedTimes, time, !blocked, timeSlots),
					blocked
						? `Has desbloqueado el horario de ${formatPickupTime(time)}.`
						: `Has bloqueado el horario de ${formatPickupTime(time)}.`
				)}
			class={cn('shadow-none', blocked && 'text-muted-foreground line-through decoration-1')}
		>
			{formatPickupTime(time)}
		</Button>
	{/each}
</div>

<p
	class="text-xs text-muted-foreground"
	role={availabilityQuery.error ? 'alert' : 'status'}
	aria-live="polite"
>
	{saving
		? 'Guardando cambios...'
		: availabilityQuery.error
			? 'No pudimos cargar la disponibilidad.'
			: availability
				? 'Los cambios se guardan automáticamente.'
				: 'Cargando disponibilidad...'}
</p>
