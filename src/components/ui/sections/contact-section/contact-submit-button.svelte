<script lang="ts">
	// LIBRARIES

	// CLASSES
	import { contactSectionClass } from './contactSection.svelte.ts';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { toast } from 'svelte-sonner';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// ACTIONS
	import { sendContactFormEmail } from '@/features/contact/actions/contactActions.remote';

	// SCHEMAS
	import { sendContactFormEmailSchema } from '@/features/contact/schemas/contactSchemas';

	// UTILS
	import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';

	let submitting = $state(false);

	async function handleSend() {
		const data = {
			name: contactSectionClass.contactInputs.name,
			email: contactSectionClass.contactInputs.email,
			message: contactSectionClass.contactInputs.message,
			website: contactSectionClass.contactInputs.website
		};

		const validation = sendContactFormEmailSchema.safeParse(data);

		if (!validation.success) {
			contactSectionClass.fieldErrors = zodIssuesToFieldErrors(validation.error.issues);
			toast.error(validation.error.issues[0]?.message);
			return;
		}

		contactSectionClass.fieldErrors = {};

		submitting = true;

		try {
			const result = await sendContactFormEmail(validation.data);

			if (!result.success) {
				toast.error(result.message);
				return;
			}

			toast.success(result.message);
			contactSectionClass.clearInputs();
		} finally {
			submitting = false;
		}
	}
</script>

<Button type="button" class="mt-4 w-full shadow-none" disabled={submitting} onclick={handleSend}>
	{#if submitting}
		<Spinner />
	{/if}
	Send message
</Button>
