// TYPES
import type { FieldErrors } from '@/shared/types/types';

/** Occasions offered in the event picker. Labels are display copy; values are stable keys. */
export const EVENT_TYPES = [
	{ value: 'birthday', label: 'Cumpleaños' },
	{ value: 'tasting', label: 'Cata privada' },
	{ value: 'corporate', label: 'Cena de empresa' },
	{ value: 'intimate', label: 'Celebración íntima' },
	{ value: 'other', label: 'Otro' }
] as const;

class ContactSectionClass {
	public fieldErrors = $state<FieldErrors>({});

	public contactInputs = $state({
		name: '',
		email: '',
		message: '',
		/** Honeypot — must remain empty. Hidden from real users via CSS. */
		website: ''
	});

	/**
	 * Event details, revealed only when the sender says this is an event.
	 *
	 * Client-side only, and deliberately so: they fold into `message` at send time rather than
	 * widening the contact schema and its action. An event inquiry is still a message — it just
	 * arrives carrying the three facts we would otherwise trade two emails to obtain (what, when,
	 * how many).
	 */
	public eventInputs = $state({
		isEvent: false,
		type: 'birthday' as (typeof EVENT_TYPES)[number]['value'],
		date: '',
		guests: ''
	});

	get eventTypeLabel(): string {
		return EVENT_TYPES.find((t) => t.value === this.eventInputs.type)?.label ?? '';
	}

	/**
	 * The message actually sent: the sender's own words, plus an event block when relevant.
	 * Composed in one place so both routes (email and WhatsApp) carry identical content.
	 */
	get composedMessage(): string {
		const { isEvent, date, guests } = this.eventInputs;
		if (!isEvent) return this.contactInputs.message;

		return [
			this.contactInputs.message,
			'',
			'— Evento —',
			`Tipo: ${this.eventTypeLabel}`,
			date ? `Fecha tentativa: ${date}` : null,
			guests ? `No. de personas: ${guests}` : null
		]
			.filter((line): line is string => line !== null)
			.join('\n');
	}

	clearInputs() {
		this.contactInputs = {
			name: '',
			email: '',
			message: '',
			website: ''
		};
		this.eventInputs = { isEvent: false, type: 'birthday', date: '', guests: '' };
		this.fieldErrors = {};
	}
}

export const contactSectionClass = new ContactSectionClass();
