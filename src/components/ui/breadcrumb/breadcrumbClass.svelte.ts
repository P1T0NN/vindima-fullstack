/** Optional label for the current page crumb (e.g. entity name on edit routes). */
class BreadcrumbLabel {
	current = $state<string | undefined>(undefined);

	set(label: string | undefined) {
		this.current = label;
	}

	reset() {
		this.current = undefined;
	}
}

export const breadcrumbLabel = new BreadcrumbLabel();
