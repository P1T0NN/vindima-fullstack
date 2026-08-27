<script lang="ts">

	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';
	import { mode } from 'mode-watcher';

	let { ...restProps }: SonnerProps = $props();
</script>

<!--
	`pointer-events: auto` keeps toasts (and their action buttons, e.g. cart "Undo")
	clickable while a modal dialog/sheet is open. bits-ui modals set `pointer-events: none`
	on <body>, and since `pointer-events` inherits, the portaled toaster would otherwise
	go inert. sonner never sets it explicitly, so an override here restores interaction.
-->
<Sonner
	theme={mode.current}
	class="toaster group"
	style="--normal-bg: var(--color-popover); --normal-text: var(--color-popover-foreground); --normal-border: var(--color-border); pointer-events: auto;"
	{...restProps}
	>{#snippet loadingIcon()}
		<span class="icon-[lucide--loader-2] size-4 animate-spin" ></span>
	{/snippet}
	{#snippet successIcon()}
		<span class="icon-[lucide--circle-check] size-4" ></span>
	{/snippet}
	{#snippet errorIcon()}
		<span class="icon-[lucide--octagon-x] size-4" ></span>
	{/snippet}
	{#snippet infoIcon()}
		<span class="icon-[lucide--info] size-4" ></span>
	{/snippet}
	{#snippet warningIcon()}
		<span class="icon-[lucide--triangle-alert] size-4" ></span>
	{/snippet}
</Sonner>
