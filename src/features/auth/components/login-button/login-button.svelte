<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
</script>

<Button variant="outline" href={appHref(UNPROTECTED_PAGE_ENDPOINTS.LOGIN)}>Login</Button>
