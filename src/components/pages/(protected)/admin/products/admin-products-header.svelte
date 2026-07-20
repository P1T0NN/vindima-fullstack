<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
</script>

<header class="flex flex-wrap items-center justify-between gap-3">
	<div class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Products</h1>
		
		<p class="text-sm text-muted-foreground">
			Manage your catalog — products, variants, prices, and availability.
		</p>
	</div>

	<Button href={ADMIN_PAGE_ENDPOINTS.ADD_PRODUCT}>New product</Button>
</header>
