<script lang="ts">
	// COMPONENTS
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof Input>, 'type' | 'inputmode' | 'maxlength' | 'files'>;

	let {
		ref = $bindable(null),
		value = $bindable(''),
		class: className,
		placeholder = 'DD/MM',
		oninput,
		...restProps
	}: Props = $props();

	function formatBirthdayInput(raw: string): string {
		const digits = raw.replace(/\D/g, '').slice(0, 4);
		if (digits.length <= 2) return digits;
		return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	}

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		const input = event.currentTarget;
		const formatted = formatBirthdayInput(input.value);

		if (formatted !== input.value) {
			input.value = formatted;
		}

		value = formatted;
		oninput?.(event);
	}
</script>

<Input
	bind:ref
	type="text"
	inputmode="numeric"
	autocomplete="bday"
	maxlength={5}
	{placeholder}
	bind:value
	oninput={handleInput}
	class={cn(className)}
	{...restProps}
/>
