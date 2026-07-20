<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { ASSETS_DATA, COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import Section from '@/components/ui/section/section.svelte';

	let name = $state('');
	let eventType = $state('birthday');
	let date = $state('');
	let guests = $state('');
	let message = $state('');

	const eventTypes = [
		{ value: 'birthday', label: () => 'Birthday' },
		{ value: 'tasting', label: () => 'Private tasting' },
		{ value: 'corporate', label: () => 'Company dinner' },
		{ value: 'intimate', label: () => 'Intimate celebration' },
		{ value: 'other', label: () => 'Other' }
	] as const;

	function selectedEventTypeLabel(): string {
		return eventTypes.find((type) => type.value === eventType)?.label() ?? eventType;
	}

	function sendEventInquiry() {
		const text = [
			"Hi Vindima! I'm planning an event.",
			'',
			`${'Name'}: ${name}`,
			`${'Event type'}: ${selectedEventTypeLabel()}`,
			`${'Tentative date'}: ${date}`,
			`${'Number of guests'}: ${guests}`,
			`${'Message'}: ${message}`
		].join('\n');

		window.open(
			`${COMPANY_DATA.WHATSAPP_CONTACT_URL}?text=${encodeURIComponent(text)}`,
			'_blank',
			'noopener,noreferrer'
		);
	}
</script>

<Section
	id="events"
	contain={false}
	yPadding="none"
	class="relative overflow-hidden bg-accent py-14 pb-24 sm:py-16 sm:pb-28"
>
	<img
		src={ASSETS_DATA.GLASS}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute top-20 -left-8 w-44 opacity-15"
		loading="lazy"
		decoding="async"
	/>
	<img
		src={ASSETS_DATA.BOARD}
		alt=""
		aria-hidden="true"
		class="pointer-events-none absolute -right-16 -bottom-8 w-72 opacity-10"
		loading="lazy"
		decoding="async"
	/>

	<div class="relative mx-auto w-full max-w-2xl px-4 text-center sm:px-6 lg:px-8">
		<p class="mb-4 text-xs font-medium tracking-widest text-primary uppercase">Private events</p>
		<h2
			class="mb-3.5 font-display text-4xl leading-tight font-semibold text-background uppercase sm:text-5xl"
		>
			Planning<br />
			an event?
		</h2>
		<p class="mx-auto mb-9 max-w-md text-sm leading-relaxed text-accent-surface-muted">
			Birthdays, private tastings, company dinners or intimate celebrations. Tell us what you have
			in mind and we will reply directly on WhatsApp.
		</p>

		<Card class="gap-0 rounded-xl border-0 bg-card px-9 py-10 text-left shadow-brand-form">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4">
				<div class="flex flex-col gap-1.5">
					<Label
						for="event-name"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>
						Name
					</Label>
					<Input
						id="event-name"
						bind:value={name}
						placeholder="Mariana Reyes"
						class="h-auto rounded-sm px-3 py-3"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label
						for="event-type"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>
						Event type
					</Label>
					<select
						id="event-type"
						bind:value={eventType}
						class="h-auto w-full rounded-sm border border-input bg-background px-3 py-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
					>
						{#each eventTypes as type (type.value)}
							<option value={type.value}>{type.label()}</option>
						{/each}
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label
						for="event-date"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>
						Tentative date
					</Label>
					<Input
						id="event-date"
						bind:value={date}
						placeholder="14 / 08 / 2026"
						class="h-auto rounded-sm px-3 py-3"
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<Label
						for="event-guests"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>
						Number of guests
					</Label>
					<Input
						id="event-guests"
						bind:value={guests}
						placeholder="12"
						class="h-auto rounded-sm px-3 py-3"
					/>
				</div>

				<div class="flex flex-col gap-1.5 sm:col-span-2">
					<Label
						for="event-message"
						class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
					>
						Tell us more
					</Label>
					<Textarea
						id="event-message"
						bind:value={message}
						rows={3}
						placeholder="We would love a Vindima board and wine for a toast…"
						class="min-h-0 rounded-sm px-3 py-3"
					/>
				</div>
			</div>

			<Button
				type="button"
				variant="whatsapp"
				class="mt-6 h-auto w-full justify-center px-6 py-4 text-sm tracking-wider uppercase"
				onclick={sendEventInquiry}
			>
				<svg
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
					class="shrink-0"
				>
					<path
						d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 .9-2.2.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.3c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.4.1.1.1.6-.1 1.1Z"
					/>
				</svg>
				Send via WhatsApp
			</Button>

			<p class="mt-3.5 text-center text-xs leading-snug text-muted-foreground/80">
				WhatsApp will open with your message ready to send.
			</p>
		</Card>
	</div>
</Section>
