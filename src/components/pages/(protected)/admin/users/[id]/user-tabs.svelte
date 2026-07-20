<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs/index.js';
	import UserOverview from '@/components/pages/(protected)/admin/users/[id]/user-overview.svelte';
	import UserSessions from '@/components/pages/(protected)/admin/users/[id]/user-sessions.svelte';
	import UserAccounts from '@/components/pages/(protected)/admin/users/[id]/user-accounts.svelte';
	import UserActivity from '@/components/pages/(protected)/admin/users/[id]/user-activity.svelte';
	import UserRewards from '@/components/pages/(protected)/admin/users/[id]/user-rewards.svelte';
	import UserDangerZone from '@/components/pages/(protected)/admin/users/[id]/user-danger-zone/user-danger-zone.svelte';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	type Props = {
		user: Doc<'user'>;
	};

	let { user }: Props = $props();

	let activeTab = $state('overview');
</script>

<Tabs bind:value={activeTab}>
	<TabsList>
		<TabsTrigger value="overview">Resumen</TabsTrigger>
		<TabsTrigger value="sessions">Sesiones</TabsTrigger>
		<TabsTrigger value="accounts">Cuentas</TabsTrigger>
		<TabsTrigger value="activity">Actividad</TabsTrigger>
		<TabsTrigger value="rewards">Recompensas</TabsTrigger>
		<TabsTrigger value="danger">Zona de peligro</TabsTrigger>
	</TabsList>

	<TabsContent value="overview" class="pt-2">
		<UserOverview {user} />
	</TabsContent>

	<TabsContent value="sessions" class="pt-2">
		<UserSessions userId={user._id} />
	</TabsContent>

	<TabsContent value="accounts" class="pt-2">
		<UserAccounts userId={user._id} />
	</TabsContent>

	<TabsContent value="activity" class="pt-2">
		<UserActivity userId={user._id} />
	</TabsContent>

	<TabsContent value="rewards" class="pt-2">
		<UserRewards userId={user._id} />
	</TabsContent>

	<TabsContent value="danger" class="pt-2">
		<UserDangerZone {user} />
	</TabsContent>
</Tabs>
