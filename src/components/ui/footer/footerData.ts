// LIBRARIES

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

export const footerNavLinks = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.SHOP, label: 'Shop' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ABOUT, label: 'About us' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.EVENTS, label: 'Events' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.NEWS, label: 'News' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: 'Contact' }
] as const;
