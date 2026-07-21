<script lang="ts">
	// COMPONENTS
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '@/components/ui/card/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';
</script>

<Card class="gap-0 overflow-hidden rounded-xl border border-destructive/20 p-0 shadow-brand-panel">
	<div class="flex flex-col gap-5 px-8 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-10">
		<CardHeader class="min-w-0 flex-1 gap-1.5 p-0">
			<p class="text-xs font-medium tracking-wide text-destructive/70 uppercase">Sesión</p>
			<CardTitle class="font-display text-xl font-semibold tracking-wide text-destructive uppercase">
				Cerrar sesión
			</CardTitle>
			<CardDescription class="max-w-md text-sm leading-relaxed text-muted-foreground">
				Saldrás de tu cuenta en este dispositivo. Puedes volver a entrar cuando quieras.
			</CardDescription>
		</CardHeader>

		<CardContent class="shrink-0 p-0">
			<LogoutButton variant="destructive" class="w-full min-w-44 justify-center sm:w-auto" />
		</CardContent>
	</div>
</Card>
