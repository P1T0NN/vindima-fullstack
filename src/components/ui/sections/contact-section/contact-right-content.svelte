<script lang="ts">
	// LIBRARIES

	// CLASSES
	import { contactSectionClass } from './contactSection.svelte.ts';

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

		<p class="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
			Sin spam — solo una respuesta cuando volvamos a revisar tu mensaje.
		</p>
	</Card.Content>
</Card.Root>
