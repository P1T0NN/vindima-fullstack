<script lang="ts">
	import {
		DateFormatter,
		getLocalTimeZone,
		parseDate,
		today,
		type DateValue
	} from '@internationalized/date';
	import { Button } from '@/components/ui/button/index.js';
	import { Calendar } from '@/components/ui/calendar/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { INTL_LOCALE } from '@/utils/intlLocale.js';

	let {
		value,
		onValueChange,
		disabled = false
	}: {
		value: string;
		onValueChange: (value: string) => void;
		disabled?: boolean;
	} = $props();

	const popoverId = 'add-coupon-expiry-popover';
	const selectedDate = $derived(value ? parseDate(value) : undefined);
	const minDate = today(getLocalTimeZone());
	const formatter = new DateFormatter(INTL_LOCALE, { dateStyle: 'medium', timeZone: 'UTC' });
	const displayValue = $derived(
		selectedDate ? formatter.format(selectedDate.toDate('UTC')) : 'Seleccionar fecha'
	);

	function selectDate(date: DateValue | undefined): void {
		onValueChange(date?.toString() ?? '');
		const popover = document.getElementById(popoverId);
		if (popover?.matches(':popover-open')) popover.hidePopover();
	}
</script>

<div class="w-full [&>button]:w-full" inert={disabled}>
	<NativePopover id={popoverId} align="start" class="w-auto min-w-0 p-0">
		{#snippet trigger()}
			<span class="flex h-9 w-full items-center gap-2 rounded-md border bg-input/50 px-3 text-sm">
				<span class="icon-[lucide--calendar] size-4 shrink-0" aria-hidden="true"></span>
				<span class="sr-only">Vencimiento: </span>{displayValue}
			</span>
		{/snippet}
		<Calendar
			type="single"
			value={selectedDate}
			minValue={minDate}
			locale={INTL_LOCALE}
			captionLayout="dropdown"
			onValueChange={selectDate}
		/>
		{#if selectedDate}
			<div class="flex justify-end border-t p-2">
				<Button type="button" variant="ghost" size="sm" onclick={() => selectDate(undefined)}
					>Quitar fecha</Button
				>
			</div>
		{/if}
	</NativePopover>
</div>
