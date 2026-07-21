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

export type AppSidebarNavGroup = {
	label: string;
	items: AppSidebarNavItem[];
};

export type AppSidebarNavGroupWithActive = {
	label: string;
	items: AppSidebarNavItemWithActive[];
};

export type AppSidebarNavItems = {
	navMain: AppSidebarNavGroup[];
	navSecondary?: AppSidebarNavItem[];
};
