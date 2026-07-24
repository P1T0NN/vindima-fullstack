<script lang="ts">
	// COMPONENTS
	import { NativeSheet } from '@/components/ui/native-sheet/index.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Direction = 'top' | 'right' | 'bottom' | 'left';

	type Props = {
		/** Controlled open state — leave undefined for the zero-JS declarative path (a trigger). */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** Edge the drawer slides in from (bits-ui/vaul `direction`). */
		direction?: Direction;
		class?: string;
		style?: string;
		showCloseButton?: boolean;
		title?: string;
		/** Trigger area — receives `props` (incl. `popovertarget`) to spread on your button. */
		trigger?: Snippet<[{ props: Record<string, unknown> }]>;
		children: Snippet<[{ popoverId: string; close: () => void }]>;
	};

	let {
		open = $bindable(undefined),
		onOpenChange,
		direction = 'bottom',
		class: className,
		style,
		showCloseButton = false,
		title,
		trigger,
		children
	}: Props = $props();
</script>

<!--
	A drawer and a sheet are the same primitive in pure CSS: a slide-in popover panel.
	`direction` maps to the sheet's `side`. Vaul's drag-to-dismiss and background scaling
	need JS, so they're intentionally omitted (open/close, backdrop, Esc, slide all native).
-->
<NativeSheet
	bind:open
	{onOpenChange}
	side={direction}
	class={className}
	{style}
	{showCloseButton}
	{title}
	{trigger}
	{children}
/>
