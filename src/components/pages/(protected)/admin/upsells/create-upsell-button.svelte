<script lang="ts">
	// The one "create an upsell" button — opens the builder dialog natively (zero JS).
	// Used by the page header and the empty state so both stay identical.

	// COMPONENTS
	import { NativeDialogTrigger } from '@/components/ui/native-dialog/index.js';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		dialogId,
		label = 'Nueva sugerencia',
		class: className
	}: {
		/** Id of the builder `<NativeDialog>` this button opens. */
		dialogId: string;
		label?: string;
		class?: string;
	} = $props();
</script>

<NativeDialogTrigger {dialogId} class="shrink-0 gap-2 {className ?? ''}">
	<PlusIcon class="size-4" />
	{label}
</NativeDialogTrigger>
