<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import AccountClubCardHeader from './account-club-card-header.svelte';
	import AccountClubCardExpiryWarning from './account-club-card-expiry-warning.svelte';
	import AccountClubCardRewardProgress from './account-club-card-reward-progress.svelte';
	import AccountClubCardPurchaseHistory from './account-club-card-purchase-history/account-club-card-purchase-history.svelte';

	// TYPES
	import type { PurchaseHistoryRow } from './accountClubCardTypes';

	let { history }: { history: PurchaseHistoryRow[] } = $props();
</script>

<Card class="gap-0 overflow-hidden rounded-xl border border-accent/10 p-0 shadow-brand-panel">
	<AccountClubCardHeader />
	<AccountClubCardExpiryWarning />
	<AccountClubCardRewardProgress />
	<AccountClubCardPurchaseHistory {history} />
</Card>
