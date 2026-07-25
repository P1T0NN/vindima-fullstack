<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// CLASSES
	import { contactSectionClass, EVENT_TYPES } from './contactSection.svelte.ts';

	// LUCIDE ICONS
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';

	/**
	 * WhatsApp is the second route the old events section offered, kept because it is how this
	 * business actually talks to people. It sends the SAME composed message as the email button,
	 * so neither channel carries less information than the other.
	 */
	function sendViaWhatsApp() {
		const { name } = contactSectionClass.contactInputs;
		const text = [
			`¡Hola ${COMPANY_DATA.NAME}!`,
			name ? `Soy ${name}.` : null,
			'',
			contactSectionClass.composedMessage
		]
			.filter((line): line is string => line !== null)
			.join('\n');

		window.open(
			`${COMPANY_DATA.WHATSAPP_CONTACT_URL}?text=${encodeURIComponent(text)}`,
			'_blank',
			'noopener,noreferrer'
		);
	}

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import {
		Field,
		FieldContent,
		FieldError,
		FieldGroup,
		FieldLabel,
		FieldSet
	} from '@/components/ui/field';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Textarea } from '@/components/ui/textarea/index.js';
	import ContactSubmitButton from './contact-submit-button.svelte';

	// UTILS
	import { clearFieldErrorOn } from '@/shared/utils/validationUtils.js';
</script>

<Card.Root class="gap-0 border-0 bg-background p-4 shadow-xl sm:p-5">
	<Card.Header class="p-0">
		<Card.Title class="text-base font-semibold text-foreground">Envíanos un mensaje</Card.Title>

		<Card.Description class="mt-1 text-sm text-muted-foreground">
			Cuéntanos tu consulta y te responderemos lo antes posible — normalmente en menos de 24 horas.
		</Card.Description>
	</Card.Header>

	<Card.Content class="p-0 pt-3">
		<FieldSet>
			<FieldGroup class="gap-4">
				<Field data-invalid={Boolean(contactSectionClass.fieldErrors.name)}>
					<FieldLabel for="contact-name">Tu nombre</FieldLabel>

					<FieldContent>
						<Input
							id="contact-name"
							bind:value={contactSectionClass.contactInputs.name}
							type="text"
							name="name"
							autocomplete="name"
							placeholder="Tu nombre completo"
							aria-invalid={Boolean(contactSectionClass.fieldErrors.name)}
							oninput={clearFieldErrorOn(contactSectionClass, 'name')}
						/>

						{#if contactSectionClass.fieldErrors.name}
							<FieldError>{contactSectionClass.fieldErrors.name}</FieldError>
						{/if}
					</FieldContent>
				</Field>

				<Field data-invalid={Boolean(contactSectionClass.fieldErrors.email)}>
					<FieldLabel for="contact-email">Correo electrónico</FieldLabel>

					<FieldContent>
						<Input
							id="contact-email"
							bind:value={contactSectionClass.contactInputs.email}
							type="email"
							name="email"
							autocomplete="email"
							placeholder="correo@ejemplo.com"
							aria-invalid={Boolean(contactSectionClass.fieldErrors.email)}
							oninput={clearFieldErrorOn(contactSectionClass, 'email')}
						/>

						{#if contactSectionClass.fieldErrors.email}
							<FieldError>{contactSectionClass.fieldErrors.email}</FieldError>
						{/if}
					</FieldContent>
				</Field>

				<Field data-invalid={Boolean(contactSectionClass.fieldErrors.message)}>
					<FieldLabel for="contact-message">Mensaje</FieldLabel>

					<FieldContent>
						<Textarea
							id="contact-message"
							bind:value={contactSectionClass.contactInputs.message}
							name="message"
							rows={5}
							placeholder="Fecha, número de personas, tipo de evento, alergias — lo que nos ayude a prepararnos."
							aria-invalid={Boolean(contactSectionClass.fieldErrors.message)}
							oninput={clearFieldErrorOn(contactSectionClass, 'message')}
							class="resize-none"
						/>

						{#if contactSectionClass.fieldErrors.message}
							<FieldError>{contactSectionClass.fieldErrors.message}</FieldError>
						{/if}
					</FieldContent>
				</Field>

				<!--
					Progressive disclosure instead of a second form: most senders are asking a plain
					question, so the three event fields stay folded away until someone says the visit
					is an occasion. That keeps one section honest for both audiences without making
					the common case fill in a date and a headcount it doesn't have.
				-->
				<div class="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
					<label class="flex cursor-pointer items-start gap-3 text-sm text-foreground">
						<input
							type="checkbox"
							bind:checked={contactSectionClass.eventInputs.isEvent}
							class="mt-0.5 size-4 shrink-0 rounded-sm border-input accent-primary"
						/>
						<span>
							Es para un evento privado
							<span class="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
								Cumpleaños, cata, cena de empresa o celebración. Nos ayuda a responderte con
								disponibilidad y precio de una vez.
							</span>
						</span>
					</label>

					{#if contactSectionClass.eventInputs.isEvent}
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field class="sm:col-span-2">
								<FieldLabel for="event-type">Tipo de evento</FieldLabel>
								<FieldContent>
									<select
										id="event-type"
										bind:value={contactSectionClass.eventInputs.type}
										class="h-auto w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
									>
										{#each EVENT_TYPES as type (type.value)}
											<option value={type.value}>{type.label}</option>
										{/each}
									</select>
								</FieldContent>
							</Field>

							<Field>
								<FieldLabel for="event-date">Fecha tentativa</FieldLabel>
								<FieldContent>
									<Input
										id="event-date"
										bind:value={contactSectionClass.eventInputs.date}
										placeholder="14 / 08 / 2026"
										autocomplete="off"
									/>
								</FieldContent>
							</Field>

							<Field>
								<FieldLabel for="event-guests">No. de personas</FieldLabel>
								<FieldContent>
									<Input
										id="event-guests"
										bind:value={contactSectionClass.eventInputs.guests}
										placeholder="12"
										inputmode="numeric"
										autocomplete="off"
									/>
								</FieldContent>
							</Field>
						</div>
					{/if}
				</div>
			</FieldGroup>
		</FieldSet>

		<!--
			Honeypot — invisible to humans (off-screen + aria-hidden + tabindex=-1),
			but most form-stuffing bots will fill it in. Server rejects any non-empty value.
		-->
		<div
			aria-hidden="true"
			style="position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;"
		>
			<label for="contact-website">Sitio web</label>
			<input
				id="contact-website"
				type="text"
				name="website"
				autocomplete="off"
				tabindex={-1}
				bind:value={contactSectionClass.contactInputs.website}
			/>
		</div>

		<ContactSubmitButton />

		<Button
			type="button"
			variant="whatsapp"
			class="mt-3 w-full justify-center shadow-none"
			onclick={sendViaWhatsApp}
		>
			<MessageCircleIcon class="size-4" strokeWidth={2} />
			Enviar por WhatsApp
		</Button>

		<p class="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
			Sin spam, solo una respuesta cuando revisemos tu mensaje. WhatsApp se abre con el mensaje
			listo para enviar.
		</p>
	</Card.Content>
</Card.Root>
