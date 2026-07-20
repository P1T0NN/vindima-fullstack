<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// LUCIDE ICONS
	import CopyIcon from '@lucide/svelte/icons/copy';
	import CheckIcon from '@lucide/svelte/icons/check';

	type Props = {
		value: string;
		/** Accessible label shown to assistive tech and as a tooltip. */
		label?: string;
		class?: string;
	};

	let { value, label = 'Copy', class: className }: Props = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | null = null;

	async function handleCopy(event: MouseEvent) {
		// Prevent the click from bubbling to a wrapping link/row click handler.
		event.preventDefault();
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			if (timer) clearTimeout(timer);
			timer = setTimeout(() => {
				copied = false;
			}, 1500);
		} catch {
			// Clipboard can throw on insecure origin or when permission is denied.
			// Silent failure: surfacing it would require i18n + toast plumbing here,
			// and the user can always select the text manually.
		}
	}

	$effect(() => () => {
		if (timer) clearTimeout(timer);
	});
</script>

<Button
	type="button"
	variant="ghost"
	size="icon-sm"
	class={className}
	aria-label={copied ? 'Copied' : label}
	title={copied ? 'Copied' : label}
	onclick={handleCopy}
>
	{#if copied}
		<CheckIcon />
	{:else}
		<CopyIcon />
	{/if}
</Button>
