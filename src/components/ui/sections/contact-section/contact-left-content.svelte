<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
	import MailIcon from '@lucide/svelte/icons/mail';
</script>

<div>
	<p class="mb-3 text-xs font-semibold tracking-[0.3em] text-primary-foreground/60 uppercase">
		Contacto
	</p>

	<h2
		id="contact-heading"
		class="text-4xl leading-[1.05] font-normal text-primary-foreground md:text-5xl"
	>
		Planemos<br />
		<span class="font-serif italic">tu evento</span>
	</h2>

	<p class="mt-6 max-w-sm text-base leading-relaxed text-primary-foreground/70">
		Ya sea una reserva para tu mesa, una tabla para llevar o un evento privado — cuéntanos qué
		tienes en mente. Leemos cada mensaje y solemos responder en menos de 24 horas.
	</p>

	<div class="my-10 h-px bg-linear-to-r from-primary-foreground/20 to-transparent"></div>

	<p class="mb-5 text-sm text-primary-foreground/60">¿Prefieres escribirnos?</p>

	<div class="flex flex-col gap-4">
		<a
			href={`mailto:${COMPANY_DATA.EMAIL}`}
			rel="external"
			class="group inline-flex items-center gap-2 text-sm font-semibold text-primary-foreground transition-colors hover:text-primary-foreground/70"
		>
			<MailIcon class="h-4 w-4 text-primary-foreground" />
			{COMPANY_DATA.EMAIL}
			<ArrowRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-1" />
		</a>
	</div>
</div>
