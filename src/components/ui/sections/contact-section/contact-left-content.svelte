<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MailIcon from '@lucide/svelte/icons/mail';
	import PhoneIcon from '@lucide/svelte/icons/phone';

	/**
	 * What people actually book. The standalone events section buried these in a paragraph;
	 * naming them as ruled entries is what makes "we host events" concrete — a reader recognises
	 * their own occasion at a glance instead of decoding prose.
	 */
	const occasions = [
		{ title: 'Cumpleaños', detail: 'Mesa larga, tabla y vino para brindar.' },
		{ title: 'Catas privadas', detail: 'Guiadas, para grupos pequeños.' },
		{ title: 'Cenas de empresa', detail: 'Menú cerrado y espacio reservado.' },
		{ title: 'Celebraciones íntimas', detail: 'Aniversarios, despedidas, sobremesas largas.' }
	] as const;
</script>

<div>
	<p class="mb-3 text-xs font-semibold tracking-[0.3em] text-primary-foreground/60 uppercase">
		Contacto y eventos
	</p>

	<h2
		id="contact-heading"
		class="text-4xl leading-[1.05] font-normal text-primary-foreground md:text-5xl"
	>
		Planemos<br />
		<span class="font-serif italic">tu evento</span>
	</h2>

	<p class="mt-6 max-w-sm text-base leading-relaxed text-primary-foreground/70">
		Ya sea una reserva para tu mesa, una tabla para llevar o un evento privado, cuéntanos qué tienes
		en mente. Leemos cada mensaje y solemos responder en menos de 24 horas.
	</p>

	<!-- Ruled entries, not a grid of identical cards: the same row rhythm the order surfaces use. -->
	<ul class="mt-9 flex flex-col">
		{#each occasions as occasion (occasion.title)}
			<li
				class="flex flex-col gap-0.5 border-t border-primary-foreground/15 py-3.5 first:border-t-0 first:pt-0"
			>
				<span class="text-sm font-semibold text-primary-foreground">{occasion.title}</span>
				<span class="text-sm leading-relaxed text-primary-foreground/60">{occasion.detail}</span>
			</li>
		{/each}
	</ul>

	<div class="my-9 h-px bg-linear-to-r from-primary-foreground/20 to-transparent"></div>

	<!-- Practical facts, carried over from the contact block this section replaced so nothing a
	     visitor needs (where, when, which number) was lost in the merge. -->
	<dl class="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
		<div>
			<dt
				class="mb-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-primary-foreground/50 uppercase"
			>
				Dónde estamos
			</dt>
			<dd class="text-sm leading-relaxed text-primary-foreground/80">
				Centro, Aguascalientes<br />
				Aguascalientes, México
			</dd>
		</div>

		<div>
			<dt
				class="mb-1.5 text-[0.7rem] font-semibold tracking-[0.18em] text-primary-foreground/50 uppercase"
			>
				Horario
			</dt>
			<dd class="text-sm leading-relaxed text-primary-foreground/80">
				Martes a Domingo<br />
				13:00 – 23:00
			</dd>
		</div>

		<div class="sm:col-span-2">
			<dt
				class="mb-2 text-[0.7rem] font-semibold tracking-[0.18em] text-primary-foreground/50 uppercase"
			>
				¿Prefieres escribirnos?
			</dt>
			<dd class="flex flex-col gap-2">
				<a
					href={`mailto:${COMPANY_DATA.EMAIL}`}
					rel="external"
					class="group inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground transition-colors hover:text-primary-foreground/70"
				>
					<MailIcon class="h-4 w-4 text-primary-foreground" />
					{COMPANY_DATA.EMAIL}
					<ArrowRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-1" />
				</a>
				<a
					href={`tel:${COMPANY_DATA.PHONE.replace(/\s/g, '')}`}
					rel="external"
					class="inline-flex items-center gap-2 text-sm text-primary-foreground/80 transition-colors hover:text-primary-foreground"
				>
					<PhoneIcon class="h-4 w-4" />
					{COMPANY_DATA.PHONE}
				</a>
			</dd>
		</div>
	</dl>
</div>
