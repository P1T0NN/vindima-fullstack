<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';
</script>

<Section
	id="contact"
	yPadding="none"
	surface="background"
	class="py-16 pb-24 sm:pb-28"
	containerClass="max-w-6xl"
>
	<div class="mb-12 text-center">
		<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">
			We are here for you
		</p>
		<h2
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			Contact
		</h2>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
		<Card class="gap-0 rounded-xl border-0 bg-accent px-8 py-12 text-accent-surface-muted sm:px-11">
			<p class="mb-2.5 text-xs font-medium tracking-widest text-primary uppercase">
				Write to us directly
			</p>
			<h3
				class="mb-3.5 font-display text-3xl leading-tight font-semibold text-background uppercase sm:text-4xl"
			>
				Reserve or<br />
				place your order
			</h3>
			<p class="mb-7 max-w-sm text-sm leading-relaxed">
				The fastest way to reserve a table, order boards or ask about wine is on WhatsApp. We reply
				within minutes.
			</p>
			<Button
				href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
				target="_blank"
				rel="noopener noreferrer"
				variant="whatsapp"
				class="h-auto self-start px-6 py-4 text-xs tracking-wider uppercase"
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
				WhatsApp
			</Button>
		</Card>

		<Card class="gap-7 rounded-xl border border-accent/10 bg-card px-8 py-12 sm:px-11">
			<div>
				<p class="mb-2 text-xs font-semibold tracking-widest text-chart-2 uppercase">
					Where we are
				</p>
				<p class="text-sm leading-relaxed text-foreground">
					Downtown, Aguascalientes<br />
					Aguascalientes, Mexico
				</p>
			</div>

			<div class="h-px bg-accent/10" aria-hidden="true"></div>

			<div>
				<p class="mb-2 text-xs font-semibold tracking-widest text-chart-2 uppercase">Hours</p>
				<p class="text-sm leading-relaxed text-foreground">
					Tuesday to Sunday<br />
					1:00 PM – 11:00 PM
				</p>
			</div>

			<div class="h-px bg-accent/10" aria-hidden="true"></div>

			<div>
				<p class="mb-2 text-xs font-semibold tracking-widest text-chart-2 uppercase">Contact</p>
				<p class="text-sm leading-relaxed text-foreground">
					{COMPANY_DATA.EMAIL}<br />
					449 000 0000
				</p>
			</div>
		</Card>
	</div>
</Section>
