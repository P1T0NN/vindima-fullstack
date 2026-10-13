<script lang="ts">
	import AdminCouponsTableItemDelete from './admin-coupons-table-item-delete.svelte';
	import AdminCouponsTableItemStatusButton from './admin-coupons-table-item-status-button.svelte';
	import { Badge, type BadgeVariant } from '@/components/ui/badge/index.js';
	import NativePopover from '@/components/ui/native-components/native-popover/native-popover.svelte';
	import { TableCell } from '@/components/ui/table/index.js';
	import { INTL_LOCALE } from '@/utils/intlLocale.js';
	import type { Doc } from '@/convex/_generated/dataModel.js';

	let { coupon }: { coupon: Doc<'coupons'> } = $props();
	const expiresAt = $derived(coupon.expiresAt);
	const status = $derived(
		!coupon.active
			? 'disabled'
			: expiresAt !== undefined && Date.now() > expiresAt
				? 'expired'
				: 'active'
	);
	const statusVariant = $derived<BadgeVariant>(
		status === 'active' ? 'default' : status === 'expired' ? 'destructive' : 'secondary'
	);
	const formatter = new Intl.DateTimeFormat(INTL_LOCALE, { dateStyle: 'medium', timeZone: 'UTC' });
</script>

<TableCell><p class="truncate font-medium">{coupon.name}</p></TableCell>
<TableCell class="font-mono text-xs whitespace-nowrap">{coupon.code}</TableCell>
<TableCell class="text-sm whitespace-nowrap tabular-nums">{coupon.percentOff}%</TableCell>
<TableCell
	><Badge variant={statusVariant}
		>{status === 'active' ? 'Activo' : status === 'expired' ? 'Vencido' : 'Desactivado'}</Badge
	></TableCell
>
<TableCell class="text-sm whitespace-nowrap text-muted-foreground"
	>{expiresAt !== undefined ? formatter.format(expiresAt) : 'Sin vencimiento'}</TableCell
>
<TableCell class="text-sm whitespace-nowrap tabular-nums"
	>{coupon.redemptionCount}{coupon.maxRedemptions !== undefined
		? ` / ${coupon.maxRedemptions}`
		: ' usos'}</TableCell
>
<TableCell class="text-right">
	<NativePopover id={`coupon-actions-${coupon._id}`} class="min-w-44">
		{#snippet trigger()}
			<span class="flex size-8 items-center justify-center rounded-full hover:bg-muted">
				<span class="icon-[lucide--ellipsis] size-4" aria-hidden="true"></span>
				<span class="sr-only">Acciones del cupón {coupon.code}</span>
			</span>
		{/snippet}
		<AdminCouponsTableItemStatusButton couponId={coupon._id} active={coupon.active} />
		<AdminCouponsTableItemDelete couponId={coupon._id} couponCode={coupon.code} />
	</NativePopover>
</TableCell>
