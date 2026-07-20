/** Same-origin app path (e.g. `/sidebar`), not `#`, `javascript:`, or external URLs. */
export function isNavItemActive(pathname: string, href: string): boolean {
	if (!href || href === '#' || /^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
	if (pathname === href) return true;
	if (href !== '/' && pathname.startsWith(`${href}/`)) return true;
	return false;
}
