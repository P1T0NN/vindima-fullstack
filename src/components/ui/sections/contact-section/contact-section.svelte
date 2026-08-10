<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import Section from '@/components/ui/section/section.svelte';

	// LUCIDE ICONS
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';

	/** Practical facts, one ruled block each. Links render for the contact block only. */
	const facts = [
		{
			label: 'Dónde estamos',
			lines: [COMPANY_DATA.ADDRESS.LINE_1, COMPANY_DATA.ADDRESS.LINE_2]
		},
		{ label: 'Horario', lines: COMPANY_DATA.HOURS.map((h) => `${h.DAYS}: ${h.TIME}`) }
	] as const;
</script>

<Section id="contact" ariaLabelledby="contact-heading" surface="background" yPadding="lg">
	<div class="mb-12.5 text-center">
		<p class="mb-4 text-xs font-medium tracking-widest text-gold-ink uppercase">
			Estamos para atenderte
		</p>
		<h2
			id="contact-heading"
			class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
		>
			Contacto
		</h2>
	</div>

	<div class="grid grid-cols-1 items-stretch gap-6.5 lg:grid-cols-2">
		<Card class="justify-center gap-0 rounded-xl border-0 bg-accent px-8 py-10 sm:px-11 sm:py-12">
			<p class="mb-2.5 text-[11px] font-medium tracking-[0.24em] text-primary uppercase">
				Escríbenos directo
			</p>
			<h3
				class="mb-3.5 font-display text-3xl leading-tight font-semibold text-accent-foreground uppercase sm:text-[34px]"
			>
				Reserva, ordena<br />o arma tu evento
			</h3>
			<p class="mb-7 max-w-100 text-[13.5px] leading-relaxed text-accent-surface-muted">
				Mesa para esta noche, tablas para llevar, una recomendación de vino o un evento privado
				(cumpleaños, catas, cenas de empresa, celebraciones íntimas). Todo por WhatsApp, y te
				respondemos en minutos.
			</p>
			<Button
				href={COMPANY_DATA.WHATSAPP_CONTACT_URL}
				target="_blank"
				rel="noopener noreferrer"
				variant="whatsapp"
				class="self-start"
			>
				<MessageCircleIcon class="size-4" strokeWidth={2} />
				WhatsApp
			</Button>
		</Card>

		<Card
			class="justify-center gap-6.5 rounded-xl border-accent/12 bg-card px-8 py-10 sm:px-11 sm:py-12"
		>
			{#each facts as fact, i (fact.label)}
				<div class={i > 0 ? 'border-t border-accent/10 pt-6.5' : ''}>
					<p class="mb-2 text-[10.5px] font-semibold tracking-[0.18em] text-gold-ink uppercase">
						{fact.label}
					</p>
					<p class="text-sm leading-relaxed text-foreground sm:text-[14.5px]">
						{#each fact.lines as line, j (line)}
							{#if j > 0}<br />{/if}{line}
						{/each}
					</p>
				</div>
			{/each}

			<div class="border-t border-accent/10 pt-6.5">
				<p class="mb-2 text-[10.5px] font-semibold tracking-[0.18em] text-gold-ink uppercase">
					Contacto
				</p>
				<p class="flex flex-col text-sm leading-relaxed text-foreground sm:text-[14.5px]">
					<a href="mailto:{COMPANY_DATA.EMAIL}" rel="external" class="hover:text-accent">
						{COMPANY_DATA.EMAIL}
					</a>
					<a
						href="tel:{COMPANY_DATA.PHONE.replace(/\s/g, '')}"
						rel="external"
						class="hover:text-accent"
					>
						{COMPANY_DATA.PHONE}
					</a>
				</p>
			</div>
		</Card>
	</div>
</Section>
