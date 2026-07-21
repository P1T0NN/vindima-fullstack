// SVELTEKIT IMPORTS
import { resolve } from '$app/paths';

export const ADMIN_PAGE_ENDPOINTS = {
	DASHBOARD: resolve('/admin/dashboard'),
	USERS: resolve('/admin/users'),
	USER: resolve('/admin/users/:id'),
	PRODUCTS: resolve('/admin/products'),
	ADD_PRODUCT: resolve('/admin/products/add-product'),
	EDIT_PRODUCT: resolve('/admin/products/edit-product/:id'),
	CATEGORIES: resolve('/admin/categories'),
	ADD_CATEGORY: resolve('/admin/categories/add-category'),
	EDIT_CATEGORY: resolve('/admin/categories/edit-category/:id'),
	REWARDS: resolve('/admin/rewards'),
	ORDERS: resolve('/admin/orders')
} as const;

export const PROTECTED_PAGE_ENDPOINTS = {
	ACCOUNT: resolve('/account'),
	MY_ORDERS: resolve('/my-orders')
} as const;

export const UNPROTECTED_PAGE_ENDPOINTS = {
	ROOT: '/',
	// ponytail: plain string, not resolve() — the checkout route isn't built yet.
	// The cart's Checkout button points here; wire the route when checkout lands.
	CHECKOUT: resolve('/checkout'),
	CHECKOUT_SUCCESS: resolve('/checkout/success'),
	LOGIN: resolve('/login'),
	SIGNUP: resolve('/signup'),
	FORGOT_PASSWORD: resolve('/forgot-password'),
	CONTACT: '#contact',
	SHOP: '#shop',
	ABOUT: '#about',
	MARIDAJES: '#maridajes',
	EVENTS: '#events'
} as const;
