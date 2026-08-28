<script lang="ts">
	// SVELTE
	import { onDestroy } from 'svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	type Props = {
		value: string;
		/** Accessible label shown to assistive tech and as a tooltip. */
		label?: string;
		class?: string;
	};

	let { value, label = 'Copiar', class: className }: Props = $props();

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
			// Silent failure: surfacing it would require extra feedback plumbing here,
			// and the user can always select the text manually.
		}
	}

	onDestroy(() => {
		if (timer) clearTimeout(timer);
	});
</script>

<Button
	type="button"
	variant="ghost"
	size="icon-sm"
	class={className}
	aria-label={copied ? 'Copiado' : label}
	title={copied ? 'Copiado' : label}
	onclick={handleCopy}
>
	{#if copied}
		<span class="icon-[lucide--check]"></span>
	{:else}
		<span class="icon-[lucide--copy]"></span>
	{/if}
</Button>
