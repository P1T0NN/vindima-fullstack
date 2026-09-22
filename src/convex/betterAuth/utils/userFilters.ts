type UserWhere = {
	field: 'name' | 'email' | 'role' | 'banned' | 'emailVerified';
	operator: 'eq' | 'ne' | 'contains';
	value: string | boolean;
};

export function buildUserWhere(search?: string, filters?: Record<string, string>): UserWhere[] {
	const where: UserWhere[] = [];
	if (filters?.role === 'admin' || filters?.role === 'user') {
		where.push({ field: 'role', operator: filters.role === 'admin' ? 'eq' : 'ne', value: 'admin' });
	}
	if (filters?.status === 'active' || filters?.status === 'banned') {
		where.push({
			field: 'banned',
			operator: filters.status === 'banned' ? 'eq' : 'ne',
			value: true
		});
	}
	if (filters?.verification === 'verified' || filters?.verification === 'unverified') {
		where.push({
			field: 'emailVerified',
			operator: 'eq',
			value: filters.verification === 'verified'
		});
	}
	const term = search?.trim().slice(0, 100);
	if (term) {
		// ponytail: Better Auth pagination cannot combine name and email with OR; use email for terms containing @.
		where.push({ field: term.includes('@') ? 'email' : 'name', operator: 'contains', value: term });
	}
	return where;
}
