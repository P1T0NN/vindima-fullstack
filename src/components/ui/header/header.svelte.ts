// CONFIG
import {
	ADMIN_PAGE_ENDPOINTS,
	PROTECTED_PAGE_ENDPOINTS,
	UNPROTECTED_PAGE_ENDPOINTS
} from '@/config/pageEndpoints.js';

export const navItems = [
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ROOT, label: 'Inicio' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.SHOP, label: 'Tienda' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.ABOUT, label: 'Nosotros' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.MARIDAJES, label: 'Maridajes' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.EVENTS, label: 'Eventos' },
	{ href: UNPROTECTED_PAGE_ENDPOINTS.CONTACT, label: 'Contacto' }
] as const;

export const headerBrandClass =
	'font-display text-2xl font-semibold tracking-widest uppercase text-accent no-underline whitespace-nowrap inline-flex items-center gap-2 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm';

export const navLinkClass =
	'text-xs leading-none font-normal tracking-wide uppercase text-accent no-underline whitespace-nowrap opacity-70 transition-opacity duration-200 py-1.5 border-b-2 border-transparent hover:opacity-100 outline-none focus-visible:opacity-100 focus-visible:border-primary/50';

export const navLinkActiveClass = 'opacity-100 border-b-primary';

export const navLinkCompactClass = `${navLinkClass} tracking-normal`;

export const btnGoldClass =
	'text-xs font-semibold leading-none tracking-widest uppercase bg-primary text-accent border border-primary px-3.5 py-2.5 rounded-sm inline-flex items-center gap-2 whitespace-nowrap no-underline transition-colors duration-200 hover:bg-[#e7c069] hover:border-[#e7c069] outline-none focus-visible:ring-2 focus-visible:ring-primary/40';

export type HeaderCta = {
	href: string;
	label: string;
	/** `admin` uses the dashboard icon; `club`/`rewards` use the sparkles icon. */
	variant: 'club' | 'rewards' | 'admin';
};

/**
 * The gold header CTA depends on auth state + role:
 * - signed out → Join the Club (signup)
 * - admin      → Admin Dashboard
 * - member     → My Rewards (their club/rewards hub, i.e. `/account`)
 *
 * `role` is a better-auth additional field that isn't surfaced on the generated
 * user type, so it's read via a narrow cast — same as the admin route guard in
 * `admin/+layout.server.ts`. Keeps desktop + mobile headers in sync from one place.
 */
export function resolveHeaderCta(
	user: { role?: string } | null | undefined,
	isAuthenticated: boolean
): HeaderCta {
	if (!isAuthenticated) {
		return { href: UNPROTECTED_PAGE_ENDPOINTS.SIGNUP, label: 'Únete al Club', variant: 'club' };
	}
	if (user?.role === 'admin') {
		return { href: ADMIN_PAGE_ENDPOINTS.DASHBOARD, label: 'Panel de administración', variant: 'admin' };
	}
	return { href: PROTECTED_PAGE_ENDPOINTS.ACCOUNT, label: 'Mis Recompensas', variant: 'rewards' };
}

/** Compare against `page.url.pathname`. */
export function isNavItemActive(pathname: string, href: string): boolean {
	if (href === '/' || href === '') return pathname === '/' || pathname === '';
	return pathname === href || pathname.startsWith(`${href}/`);
}

class Header {
	menuOpen = $state(false);

	// Arrow field, not a method: it's passed as a bare `onclick={header.closeMenu}` reference,
	// so `this` must be bound here — a plain method would lose it and silently no-op on click.
	closeMenu = () => {
		this.menuOpen = false;
	};
}

export const header = new Header();

/**
 * Which in-page section is currently under the header, as a hash (`'#shop'`), or
 * `''` when above the first section (hero/top). Driven by `startScrollSpy`.
 */
class ScrollSpy {
	active = $state('');
}

export const scrollSpy = new ScrollSpy();

/**
 * Nav-active check combining route pathname with the in-page scrollspy.
 * - Hash links (`#shop`) are active only on the homepage when that section is under the header.
 * - Root (`/`) is active on the homepage when scrolled above every section (hero/top).
 * - Real routes fall back to pathname matching.
 */
export function isNavActive(pathname: string, activeHash: string, href: string): boolean {
	if (href.startsWith('#')) return pathname === '/' && activeHash === href;
	if (href === '/' || href === '') return pathname === '/' && activeHash === '';
	return isNavItemActive(pathname, href);
}

/**
 * Scrollspy via a single `IntersectionObserver` — no scroll listeners, so it costs
 * nothing during scroll (the browser only calls back when a section crosses the
 * detection band just below the sticky header). Observes only the in-page sections
 * that actually exist for the `#hash` nav items, so missing sections are simply
 * skipped. Universal: keys off `navItems`, assumes no specific ids.
 *
 * Call from a browser-only `$effect` and return the cleanup. Re-run on route change
 * (pass `pathname` as the effect's dependency) so sections are re-resolved per page.
 *
 * @param headerOffset height of the sticky header in px (detection band starts below it).
 */
export function startScrollSpy(headerOffset = 72): () => void {
	const sections = navItems
		.filter((i) => i.href.startsWith('#'))
		.map((i) => document.getElementById(i.href.slice(1)))
		.filter((el): el is HTMLElement => el !== null);

	if (sections.length === 0) {
		scrollSpy.active = '';
		return () => {};
	}

	// Detection band = from just below the header down to ~30% of the viewport. The
	// topmost section currently touching that band (DOM order) is the active one, so
	// a section stays active until it scrolls up out of the band.
	const visible = new Map<string, boolean>();
	const observer = new IntersectionObserver(
		(entries) => {
			for (const e of entries) visible.set(e.target.id, e.isIntersecting);
			const top = sections.find((s) => visible.get(s.id));
			scrollSpy.active = top ? `#${top.id}` : '';
		},
		{ rootMargin: `-${headerOffset}px 0px -70% 0px`, threshold: 0 }
	);
	sections.forEach((s) => observer.observe(s));
	return () => observer.disconnect();
}
