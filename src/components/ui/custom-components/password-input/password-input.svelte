<script lang="ts">
			import * as InputGroup from '@/components/ui/input-group/index.js';
	import type { ComponentProps } from 'svelte';

	type Props = Omit<ComponentProps<typeof InputGroup.Input>, 'type' | 'value' | 'files'> & {
		value?: string;
	};

	let {
		value = $bindable(''),
		ref = $bindable(null),
		placeholder = '********',
		disabled = false,
		class: className,
		...restProps
	}: Props = $props();

	let passwordVisible = $state(false);
</script>

<InputGroup.Root class={className}>
	<InputGroup.Input
		bind:ref
		bind:value
		type={passwordVisible ? 'text' : 'password'}
		{placeholder}
		{disabled}
		{...restProps}
	/>

	<InputGroup.Addon align="inline-end">
		<InputGroup.Button
			type="button"
			size="icon-xs"
			aria-label={passwordVisible ? 'Hide password' : 'Show password'}
			aria-pressed={passwordVisible}
			{disabled}
			onclick={() => (passwordVisible = !passwordVisible)}
		>
			{#if passwordVisible}
				<span class="icon-[lucide--eye-off]" aria-hidden="true" ></span>
			{:else}
				<span class="icon-[lucide--eye]" aria-hidden="true" ></span>
			{/if}
		</InputGroup.Button>
	</InputGroup.Addon>
</InputGroup.Root>
