// LIBRARIES

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

export const footerNavLinks = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.SHOP, label: 'Tienda' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ABOUT, label: 'Nosotros' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.MARIDAJES, label: 'Maridajes' },
	// The footer is where people instinctively look for order tracking, and it is the only
	// entry point a guest sees on every page regardless of auth state.
	{ href: UNPROTECTED_PAGE_ENDPOINTS.TRACK_ORDER, label: 'Rastrear pedido' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: 'Contacto' }
] as const;
