// LIBRARIES

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

export const footerNavLinks = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.SHOP, label: 'Tienda' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ABOUT, label: 'Nosotros' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.MARIDAJES, label: 'Maridajes' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.EVENTS, label: 'Eventos' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: 'Contacto' }
] as const;
