<script lang="ts">
	// Empty state for the revenue chart — shown when the period has no sales.

	// COMPONENTS
	import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	let { title, class: className }: { title: string; class?: string } = $props();
</script>

<Card class={cn('gap-3', className)}>
	<CardHeader>
		<CardTitle class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
			{title}
		</CardTitle>
	</CardHeader>
	<CardContent>
		<p class="flex h-48 items-center justify-center text-sm text-muted-foreground">
			Aún no hay ventas en este periodo.
		</p>
	</CardContent>
</Card>
