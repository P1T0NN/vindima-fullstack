// TYPES
import type { Component } from 'svelte';

export type AppSidebarNavItem = {
	name: string;
	url: string;
	icon: Component;
};

export type AppSidebarNavItemWithActive = AppSidebarNavItem & {
	isActive?: boolean;
};

export type AppSidebarNavItems = {
	navMain: AppSidebarNavItem[];
	navSecondary?: AppSidebarNavItem[];
};
