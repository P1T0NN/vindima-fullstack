<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';

	// CONFIG
	import { REWARDS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { ColumnDef } from '@/components/ui/data-table/types.js';
	import type { Doc } from '@/convex/_generated/dataModel';

	let { userId }: { userId: string } = $props();

	const convex = useConvexClient();

	// The tab's ONE account subscription; the ledger table below manages its own pages.
	const accountQuery = useQuery(
		api.tables.rewardAccounts.queries.fetchRewardAccount.fetchRewardAccount,
		() => ({ userId })
	);
	const account = $derived(accountQuery.data as Doc<'rewardAccounts'> | null | undefined);

	const stats = $derived([
		{
			label: 'Progreso de tarjeta',
			value: `${account?.stamps ?? 0} / ${REWARDS_CONFIG.STAMPS_PER_REWARD}`
		},
		{ label: 'Sellos pendientes', value: `${account?.pendingStamps ?? 0}` },
		{ label: 'Recompensas acumuladas', value: `${account?.availableRewards ?? 0}` },
		{ label: 'Sellos totales', value: `${account?.lifetimeStamps ?? 0}` }
	]);

	// Adjustment form. Deltas are signed integers; Apply stays disabled until one is set.
	// A cleared number input binds `null` at runtime, so read through the ?? 0 deriveds.
	let stampsDeltaRaw = $state<number | null>(0);
	let rewardsDeltaRaw = $state<number | null>(0);
	let note = $state('');
	let busy = $state(false);

	const stampsDelta = $derived(stampsDeltaRaw ?? 0);
	const rewardsDelta = $derived(rewardsDeltaRaw ?? 0);
	const nothingToApply = $derived(stampsDelta === 0 && rewardsDelta === 0);
	const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);
	const adjustSummary = $derived(
		[
			stampsDelta !== 0
				? `${signed(stampsDelta)} sello${Math.abs(stampsDelta) === 1 ? '' : 's'}`
				: null,
			rewardsDelta !== 0
				? `${signed(rewardsDelta)} recompensa${Math.abs(rewardsDelta) === 1 ? '' : 's'}`
				: null
		]
			.filter(Boolean)
			.join(' y ')
	);

	async function applyAdjustment() {
		if (busy || nothingToApply) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.rewardLedger.mutations.adminAdjustReward.adminAdjustReward,
				{ userId, stamps: stampsDelta, rewards: rewardsDelta, note: note || undefined }
			);
			if (toastResult(res)) {
				stampsDeltaRaw = 0;
				rewardsDeltaRaw = 0;
				note = '';
			}
		} finally {
			busy = false;
		}
	}

	async function rebuildAccount() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.rewardAccounts.mutations.adminRebuildRewardAccount.adminRebuildRewardAccount,
				{ userId }
			);
			toastResult(res);
		} finally {
			busy = false;
		}
	}

	// Ledger table — raw entries so the admin sees exactly what the system recorded.
	type LedgerRow = Doc<'rewardLedger'>;

	const KIND_LABELS: Record<LedgerRow['kind'], string> = {
		stamp: 'Sello',
		'reward-earned': 'Recompensa obtenida',
		claim: 'Canje',
		revoke: 'Sello revertido',
		expire: 'Caducado',
		adjust: 'Ajuste manual'
	};

	const columns: ColumnDef<LedgerRow>[] = [
		{
			id: 'date',
			header: 'Fecha',
			accessor: (r) => new Date(r._creationTime).toLocaleString()
		},
		{ id: 'kind', header: 'Evento', accessor: (r) => KIND_LABELS[r.kind] },
		{
			id: 'deltas',
			header: 'Cambio',
			accessor: (r) =>
				[
					r.stampsDelta ? `${signed(r.stampsDelta)} sellos` : null,
					r.rewardsDelta ? `${signed(r.rewardsDelta)} recompensas` : null
				]
					.filter(Boolean)
					.join(', ') || '—',
			hideBelow: 'md'
		},
		{ id: 'status', header: 'Estado', accessor: (r) => r.status ?? '—', hideBelow: 'lg' },
		{ id: 'note', header: 'Nota', accessor: (r) => r.note ?? '', hideBelow: 'md', wrap: true }
	];
</script>

<div class="flex flex-col gap-4">
	<!-- Counters at a glance -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		{#each stats as stat (stat.label)}
			<Card class="gap-1 py-4">
				<CardContent class="flex flex-col gap-1">
					<span class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
						{stat.label}
					</span>
					<span class="font-display text-2xl leading-none font-semibold">{stat.value}</span>
				</CardContent>
			</Card>
		{/each}
	</div>

	{#if account === null}
		<p class="text-sm text-muted-foreground">
			Aún no hay actividad de recompensas — la cuenta se crea automáticamente con el primer sello
			(o con un ajuste manual abajo).
		</p>
	{/if}

	<!-- Manual correction -->
	<Card>
		<CardHeader>
			<CardTitle>Ajuste manual</CardTitle>
			<CardDescription>
				Cambios con signo en el saldo de este cliente — p. ej. un sello de cortesía, o recuperar
				una recompensa tras un reembolso abusivo. Las tarjetas completas se convierten en
				recompensas automáticamente, y cada ajuste queda registrado en el historial de abajo.
			</CardDescription>
		</CardHeader>
		<CardContent class="flex flex-col gap-4">
			<div class="grid grid-cols-2 gap-3 sm:max-w-md">
				<div class="flex flex-col gap-1.5">
					<Label for="stamps-delta">Sellos Δ</Label>
					<Input id="stamps-delta" type="number" step="1" bind:value={stampsDeltaRaw} />
				</div>
				<div class="flex flex-col gap-1.5">
					<Label for="rewards-delta">Recompensas Δ</Label>
					<Input id="rewards-delta" type="number" step="1" bind:value={rewardsDeltaRaw} />
				</div>
			</div>
			<div class="flex flex-col gap-1.5 sm:max-w-md">
				<Label for="adjust-note">Nota</Label>
				<Input
					id="adjust-note"
					bind:value={note}
					placeholder="¿Por qué? El cliente lo ve en su historial de actividad."
				/>
			</div>

			<div class="flex flex-wrap items-center gap-3">
				<ActionButton
					function={applyAdjustment}
					isPending={busy}
					actionDisabled={nothingToApply}
					title="¿Aplicar este ajuste?"
					description={nothingToApply
						? 'Introduce primero un cambio de sellos o recompensas.'
						: `Esto aplica ${adjustSummary} al saldo de recompensas de este cliente y lo registra en su historial.`}
				>
					Aplicar ajuste
				</ActionButton>

				<ActionButton
					function={rebuildAccount}
					variant="outline"
					isPending={busy}
					title="¿Reconstruir cuenta de recompensas?"
					description="Recalcula el saldo reproduciendo todo el historial de este cliente. Seguro en cualquier momento — en una cuenta sana no cambia nada. Úsalo si los contadores parecen incorrectos."
				>
					Reconstruir desde historial
				</ActionButton>
			</div>
		</CardContent>
	</Card>

	<!-- The paper trail -->
	<ConvexDataTable
		caption="Historial de recompensas"
		query={api.tables.rewardLedger.queries.fetchUserLedger.fetchUserLedger}
		queryArgs={{ userId }}
		{columns}
		getRowId={(r) => r._id}
	/>
</div>
